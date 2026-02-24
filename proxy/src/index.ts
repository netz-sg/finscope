import express, { type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import crypto from 'crypto'
import path from 'path'
import fs from 'fs'
import bcrypt from 'bcryptjs'
import multer from 'multer'
import db, { AVATAR_DIR, DB_FILE_PATH } from './db.js'
import { createApi } from './jellyfin-client.js'
import {
  getSystemApi,
  getUserApi,
  getItemsApi,
  getSessionApi,
  getUserLibraryApi,
  getUserViewsApi,
  getLibraryApi,
} from '@jellyfin/sdk/lib/utils/api/index.js'
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind.js'
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields.js'
import { ItemFilter } from '@jellyfin/sdk/lib/generated-client/models/item-filter.js'
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by.js'
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order.js'

const app = express()
const PORT = parseInt(process.env.PROXY_PORT || '3001', 10)

app.use(cors())
app.use(express.json())

interface AuthUser {
  id: string
  username: string
  role: string
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

const cleanUrl = (url: string) => url.replace(/\/$/, '')

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

function createSession(userId: string): { token: string; expiresAt: string } {
  const token = generateToken()
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(
    token,
    userId,
    expiresAt,
  )
  return { token, expiresAt }
}

function maskApiKey(key: string): string {
  if (key.length <= 8) return '****'
  return key.slice(0, 4) + '***' + key.slice(-4)
}

function getJellyfinConfig(userId: string) {
  return db
    .prepare(
      'SELECT server_url, api_key, jellyfin_user_id, server_name FROM jellyfin_configs WHERE user_id = ? AND is_active = 1',
    )
    .get(userId) as
    | { server_url: string; api_key: string; jellyfin_user_id: string; server_name: string }
    | undefined
}

function getApiForUser(userId: string) {
  const config = getJellyfinConfig(userId)
  if (!config) return null
  return { api: createApi(config.server_url, config.api_key), config }
}

function jellyfinErrorStatus(err: unknown): number {
  if (err && typeof err === 'object' && 'response' in err) {
    const resp = (err as { response?: { status?: number } }).response
    return resp?.status || 502
  }
  return 502
}

function jellyfinErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const status = (err as { response?: { status?: number } }).response?.status
    return `Jellyfin returned ${status}`
  }
  if (err instanceof Error) {
    if (err.message === 'fetch failed' || err.message.includes('ECONNREFUSED')) {
      return 'Cannot reach Jellyfin server — check URL'
    }
    return err.message
  }
  return 'Unknown error'
}

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' })
    return
  }

  const token = authHeader.slice(7)
  const session = db
    .prepare(
      'SELECT s.user_id, s.expires_at, u.username, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ?',
    )
    .get(token) as
    | { user_id: string; expires_at: string; username: string; role: string }
    | undefined

  if (!session) {
    res.status(401).json({ error: 'Invalid token' })
    return
  }

  if (new Date(session.expires_at) < new Date()) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token)
    res.status(401).json({ error: 'Token expired' })
    return
  }

  req.user = { id: session.user_id, username: session.username, role: session.role }
  next()
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 512 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images allowed'))
    }
  },
})

app.get('/api/setup/status', (_req, res) => {
  const count = (db.prepare('SELECT COUNT(*) as cnt FROM users').get() as { cnt: number }).cnt
  res.json({ setupComplete: count > 0, hasUsers: count > 0 })
})

app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string }

  if (!username || !password) {
    res.status(400).json({ error: 'Missing username or password' })
    return
  }

  if (username.length < 3 || username.length > 32) {
    res.status(400).json({ error: 'Username must be 3-32 characters' })
    return
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' })
    return
  }

  const userCount = (db.prepare('SELECT COUNT(*) as cnt FROM users').get() as { cnt: number }).cnt
  if (userCount > 0) {
    res.status(403).json({ error: 'Registration closed — users already exist' })
    return
  }

  try {
    const id = crypto.randomUUID()
    const hash = await bcrypt.hash(password, 10)
    db.prepare(
      'INSERT INTO users (id, username, password_hash, display_name, role) VALUES (?, ?, ?, ?, ?)',
    ).run(id, username, hash, username, 'admin')

    const session = createSession(id)
    res.status(201).json({
      user: { id, username, displayName: username, avatarUrl: null, role: 'admin' },
      token: session.token,
      expiresAt: session.expiresAt,
    })
  } catch {
    res.status(409).json({ error: 'Username already taken' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string }

  if (!username || !password) {
    res.status(400).json({ error: 'Missing username or password' })
    return
  }

  const user = db.prepare('SELECT id, username, password_hash, display_name, avatar_path, role FROM users WHERE username = ?').get(username) as
    | { id: string; username: string; password_hash: string; display_name: string; avatar_path: string | null; role: string }
    | undefined

  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }

  const session = createSession(user.id)
  res.json({
    user: {
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      avatarUrl: user.avatar_path ? `/api/auth/avatar/${user.id}` : null,
      role: user.role,
    },
    token: session.token,
    expiresAt: session.expiresAt,
  })
})

app.post('/api/auth/logout', requireAuth, (req, res) => {
  const token = req.headers.authorization!.slice(7)
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token)
  res.json({ success: true })
})

app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = db
    .prepare('SELECT id, username, display_name, avatar_path, role, created_at FROM users WHERE id = ?')
    .get(req.user!.id) as {
    id: string
    username: string
    display_name: string
    avatar_path: string | null
    role: string
    created_at: string
  }

  const jfConfig = getJellyfinConfig(req.user!.id)

  res.json({
    user: {
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      avatarUrl: user.avatar_path ? `/api/auth/avatar/${user.id}` : null,
      role: user.role,
      createdAt: user.created_at,
    },
    jellyfinConfig: jfConfig
      ? {
          serverUrl: jfConfig.server_url,
          apiKeyMasked: maskApiKey(jfConfig.api_key),
          jellyfinUserId: jfConfig.jellyfin_user_id,
          serverName: jfConfig.server_name,
        }
      : null,
  })
})

app.patch('/api/auth/me', requireAuth, (req, res) => {
  const { username, displayName } = req.body as { username?: string; displayName?: string }

  if (username !== undefined) {
    if (username.length < 3 || username.length > 32) {
      res.status(400).json({ error: 'Username must be 3-32 characters' })
      return
    }
    try {
      db.prepare('UPDATE users SET username = ?, updated_at = datetime(\'now\') WHERE id = ?').run(
        username,
        req.user!.id,
      )
    } catch {
      res.status(409).json({ error: 'Username already taken' })
      return
    }
  }

  if (displayName !== undefined) {
    db.prepare('UPDATE users SET display_name = ?, updated_at = datetime(\'now\') WHERE id = ?').run(
      displayName,
      req.user!.id,
    )
  }

  const updated = db
    .prepare('SELECT id, username, display_name, avatar_path, role FROM users WHERE id = ?')
    .get(req.user!.id) as { id: string; username: string; display_name: string; avatar_path: string | null; role: string }

  res.json({
    user: {
      id: updated.id,
      username: updated.username,
      displayName: updated.display_name,
      avatarUrl: updated.avatar_path ? `/api/auth/avatar/${updated.id}` : null,
      role: updated.role,
    },
  })
})

app.post('/api/auth/change-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string
    newPassword?: string
  }

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Missing currentPassword or newPassword' })
    return
  }

  if (newPassword.length < 6) {
    res.status(400).json({ error: 'New password must be at least 6 characters' })
    return
  }

  const user = db
    .prepare('SELECT password_hash FROM users WHERE id = ?')
    .get(req.user!.id) as { password_hash: string }

  const valid = await bcrypt.compare(currentPassword, user.password_hash)
  if (!valid) {
    res.status(401).json({ error: 'Current password is incorrect' })
    return
  }

  const newHash = await bcrypt.hash(newPassword, 10)
  db.prepare('UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?').run(
    newHash,
    req.user!.id,
  )

  res.json({ success: true })
})

app.post('/api/auth/avatar', requireAuth, upload.single('avatar'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' })
    return
  }

  const ext = req.file.mimetype === 'image/png' ? '.png' : req.file.mimetype === 'image/webp' ? '.webp' : '.jpg'
  const filename = `${req.user!.id}${ext}`
  const filePath = path.join(AVATAR_DIR, filename)

  const oldFiles = fs.readdirSync(AVATAR_DIR).filter((f) => f.startsWith(req.user!.id))
  oldFiles.forEach((f) => fs.unlinkSync(path.join(AVATAR_DIR, f)))

  fs.writeFileSync(filePath, req.file.buffer)
  db.prepare('UPDATE users SET avatar_path = ?, updated_at = datetime(\'now\') WHERE id = ?').run(
    filename,
    req.user!.id,
  )

  res.json({ avatarUrl: `/api/auth/avatar/${req.user!.id}?t=${Date.now()}` })
})

app.delete('/api/auth/avatar', requireAuth, (req, res) => {
  const oldFiles = fs.readdirSync(AVATAR_DIR).filter((f) => f.startsWith(req.user!.id))
  oldFiles.forEach((f) => fs.unlinkSync(path.join(AVATAR_DIR, f)))

  db.prepare('UPDATE users SET avatar_path = NULL, updated_at = datetime(\'now\') WHERE id = ?').run(
    req.user!.id,
  )

  res.json({ success: true })
})

app.get('/api/auth/avatar/:userId', (req, res) => {
  const userId = req.params.userId
  const user = db.prepare('SELECT avatar_path FROM users WHERE id = ?').get(userId) as
    | { avatar_path: string | null }
    | undefined

  if (!user?.avatar_path) {
    res.status(404).end()
    return
  }

  const filePath = path.join(AVATAR_DIR, user.avatar_path)
  if (!fs.existsSync(filePath)) {
    res.status(404).end()
    return
  }

  const ext = path.extname(user.avatar_path).toLowerCase()
  const mimeMap: Record<string, string> = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }
  res.setHeader('Content-Type', mimeMap[ext] || 'image/jpeg')
  res.setHeader('Cache-Control', 'public, max-age=3600')
  res.send(fs.readFileSync(filePath))
})

app.post('/api/jellyfin-config', requireAuth, async (req, res) => {
  const { serverUrl, apiKey } = req.body as { serverUrl?: string; apiKey?: string }

  if (!serverUrl || !apiKey) {
    res.status(400).json({ error: 'Missing serverUrl or apiKey' })
    return
  }

  const baseUrl = cleanUrl(serverUrl)

  try {
    const api = createApi(baseUrl, apiKey)

    const { data: info } = await getSystemApi(api).getSystemInfo()

    let jfUserId = ''
    try {
      const { data: jfUsers } = await getUserApi(api).getUsers()
      const adminUser = jfUsers.find((u) => u.Policy?.IsAdministrator) || jfUsers[0]
      jfUserId = adminUser?.Id || ''
    } catch {
      jfUserId = ''
    }

    db.prepare(
      `INSERT INTO jellyfin_configs (user_id, server_url, api_key, jellyfin_user_id, server_name)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(user_id, server_url) DO UPDATE SET
         api_key = excluded.api_key,
         jellyfin_user_id = excluded.jellyfin_user_id,
         server_name = excluded.server_name`,
    ).run(req.user!.id, baseUrl, apiKey, jfUserId, info.ServerName || 'Jellyfin')

    db.prepare('UPDATE jellyfin_configs SET is_active = 0 WHERE user_id = ?').run(req.user!.id)
    db.prepare(
      'UPDATE jellyfin_configs SET is_active = 1 WHERE user_id = ? AND server_url = ?',
    ).run(req.user!.id, baseUrl)

    res.json({
      success: true,
      serverName: info.ServerName || 'Jellyfin',
      jellyfinUserId: jfUserId,
    })
  } catch (err) {
    res.status(jellyfinErrorStatus(err)).json({ error: jellyfinErrorMessage(err) })
  }
})

app.get('/api/jellyfin-config', requireAuth, (req, res) => {
  const config = getJellyfinConfig(req.user!.id)
  if (!config) {
    res.json({ config: null })
    return
  }
  res.json({
    config: {
      serverUrl: config.server_url,
      apiKeyMasked: maskApiKey(config.api_key),
      jellyfinUserId: config.jellyfin_user_id,
      serverName: config.server_name,
    },
  })
})

app.get('/api/jellyfin/system-info', requireAuth, async (req, res) => {
  const ctx = getApiForUser(req.user!.id)
  if (!ctx) { res.status(400).json({ error: 'No Jellyfin server configured' }); return }

  try {
    const { data } = await getSystemApi(ctx.api).getSystemInfo()
    res.json(data)
  } catch (err) {
    res.status(jellyfinErrorStatus(err)).json({ error: jellyfinErrorMessage(err) })
  }
})

app.get('/api/jellyfin/sessions', requireAuth, async (req, res) => {
  const ctx = getApiForUser(req.user!.id)
  if (!ctx) { res.status(400).json({ error: 'No Jellyfin server configured' }); return }

  try {
    const { data } = await getSessionApi(ctx.api).getSessions()
    res.json(data)
  } catch (err) {
    res.status(jellyfinErrorStatus(err)).json({ error: jellyfinErrorMessage(err) })
  }
})

app.get('/api/jellyfin/users', requireAuth, async (req, res) => {
  const ctx = getApiForUser(req.user!.id)
  if (!ctx) { res.status(400).json({ error: 'No Jellyfin server configured' }); return }

  try {
    const { data } = await getUserApi(ctx.api).getUsers()
    res.json(data)
  } catch (err) {
    res.status(jellyfinErrorStatus(err)).json({ error: jellyfinErrorMessage(err) })
  }
})

app.get('/api/jellyfin/users/:userId/history', requireAuth, async (req, res) => {
  const ctx = getApiForUser(req.user!.id)
  if (!ctx) { res.status(400).json({ error: 'No Jellyfin server configured' }); return }

  const { userId } = req.params
  const limit = parseInt(req.query.limit as string) || 3

  try {
    const { data } = await getItemsApi(ctx.api).getItems({
      userId,
      sortBy: [ItemSortBy.DatePlayed],
      sortOrder: [SortOrder.Descending],
      filters: [ItemFilter.IsPlayed],
      limit,
      recursive: true,
      enableUserData: true,
    })
    res.json(data.Items || [])
  } catch (err) {
    res.status(jellyfinErrorStatus(err)).json({ error: jellyfinErrorMessage(err) })
  }
})

app.get('/api/jellyfin/users/:userId/play-count', requireAuth, async (req, res) => {
  const ctx = getApiForUser(req.user!.id)
  if (!ctx) { res.status(400).json({ error: 'No Jellyfin server configured' }); return }

  const { userId } = req.params

  try {
    const { data } = await getItemsApi(ctx.api).getItems({
      userId,
      filters: [ItemFilter.IsPlayed],
      recursive: true,
      limit: 0,
    })
    res.json({ TotalRecordCount: data.TotalRecordCount || 0 })
  } catch (err) {
    res.status(jellyfinErrorStatus(err)).json({ error: jellyfinErrorMessage(err) })
  }
})

app.get('/api/jellyfin/item-counts', requireAuth, async (req, res) => {
  const ctx = getApiForUser(req.user!.id)
  if (!ctx) { res.status(400).json({ error: 'No Jellyfin server configured' }); return }

  try {
    const { data } = await getLibraryApi(ctx.api).getItemCounts()
    res.json(data)
  } catch (err) {
    res.status(jellyfinErrorStatus(err)).json({ error: jellyfinErrorMessage(err) })
  }
})

app.get('/api/jellyfin/users/:userId/most-played', requireAuth, async (req, res) => {
  const ctx = getApiForUser(req.user!.id)
  if (!ctx) { res.status(400).json({ error: 'No Jellyfin server configured' }); return }

  const { userId } = req.params
  const limit = parseInt(req.query.limit as string) || 5

  try {
    const { data } = await getItemsApi(ctx.api).getItems({
      userId,
      sortBy: [ItemSortBy.PlayCount],
      sortOrder: [SortOrder.Descending],
      filters: [ItemFilter.IsPlayed],
      limit,
      recursive: true,
      includeItemTypes: [BaseItemKind.Movie, BaseItemKind.Series, BaseItemKind.Audio],
      enableUserData: true,
    })
    res.json(data.Items || [])
  } catch (err) {
    res.status(jellyfinErrorStatus(err)).json({ error: jellyfinErrorMessage(err) })
  }
})

app.get('/api/jellyfin/users/:userId/latest', requireAuth, async (req, res) => {
  const ctx = getApiForUser(req.user!.id)
  if (!ctx) { res.status(400).json({ error: 'No Jellyfin server configured' }); return }

  const { userId } = req.params
  const limit = parseInt(req.query.limit as string) || 10

  try {
    const { data } = await getUserLibraryApi(ctx.api).getLatestMedia({
      userId,
      limit,
      fields: [ItemFields.PrimaryImageAspectRatio, ItemFields.Overview],
    })
    res.json(data)
  } catch (err) {
    res.status(jellyfinErrorStatus(err)).json({ error: jellyfinErrorMessage(err) })
  }
})

app.get('/api/jellyfin/users/:userId/libraries', requireAuth, async (req, res) => {
  const ctx = getApiForUser(req.user!.id)
  if (!ctx) { res.status(400).json({ error: 'No Jellyfin server configured' }); return }

  const { userId } = req.params

  try {
    const { data } = await getUserViewsApi(ctx.api).getUserViews({ userId })
    res.json(data.Items || [])
  } catch (err) {
    res.status(jellyfinErrorStatus(err)).json({ error: jellyfinErrorMessage(err) })
  }
})

app.get('/api/jellyfin/users/:userId/items/:itemId', requireAuth, async (req, res) => {
  const ctx = getApiForUser(req.user!.id)
  if (!ctx) { res.status(400).json({ error: 'No Jellyfin server configured' }); return }

  const { userId, itemId } = req.params

  try {
    const { data } = await getUserLibraryApi(ctx.api).getItem({
      itemId,
      userId,
    })
    res.json(data)
  } catch (err) {
    res.status(jellyfinErrorStatus(err)).json({ error: jellyfinErrorMessage(err) })
  }
})

app.get('/api/jellyfin/users/:userId/hero-items', requireAuth, async (req, res) => {
  const ctx = getApiForUser(req.user!.id)
  if (!ctx) { res.status(400).json({ error: 'No Jellyfin server configured' }); return }

  const { userId } = req.params

  try {
    const { data } = await getItemsApi(ctx.api).getItems({
      userId,
      sortBy: [ItemSortBy.Random],
      limit: 10,
      recursive: true,
      includeItemTypes: [BaseItemKind.Movie, BaseItemKind.Series],
      fields: [ItemFields.Overview],
    })
    res.json(data.Items || [])
  } catch (err) {
    res.status(jellyfinErrorStatus(err)).json({ error: jellyfinErrorMessage(err) })
  }
})

app.get('/api/jellyfin/users/:userId/artist-albums', requireAuth, async (req, res) => {
  const ctx = getApiForUser(req.user!.id)
  if (!ctx) { res.status(400).json({ error: 'No Jellyfin server configured' }); return }

  const { userId } = req.params
  const artistId = req.query.artistId as string

  if (!artistId) { res.status(400).json({ error: 'Missing artistId' }); return }

  try {
    const { data } = await getItemsApi(ctx.api).getItems({
      userId,
      artistIds: [artistId],
      includeItemTypes: [BaseItemKind.MusicAlbum],
      recursive: true,
      sortBy: [ItemSortBy.ProductionYear, ItemSortBy.SortName],
      sortOrder: [SortOrder.Descending],
      fields: [ItemFields.Overview, ItemFields.Genres],
    })
    res.json(data.Items || [])
  } catch (err) {
    res.status(jellyfinErrorStatus(err)).json({ error: jellyfinErrorMessage(err) })
  }
})

app.get('/api/jellyfin/users/:userId/album-tracks', requireAuth, async (req, res) => {
  const ctx = getApiForUser(req.user!.id)
  if (!ctx) { res.status(400).json({ error: 'No Jellyfin server configured' }); return }

  const { userId } = req.params
  const albumId = req.query.albumId as string

  if (!albumId) { res.status(400).json({ error: 'Missing albumId' }); return }

  try {
    const { data } = await getItemsApi(ctx.api).getItems({
      userId,
      parentId: albumId,
      sortBy: [ItemSortBy.ParentIndexNumber, ItemSortBy.IndexNumber],
    })
    res.json(data.Items || [])
  } catch (err) {
    res.status(jellyfinErrorStatus(err)).json({ error: jellyfinErrorMessage(err) })
  }
})

app.post('/api/history/sync', requireAuth, async (req, res) => {
  const ctx = getApiForUser(req.user!.id)
  if (!ctx) {
    res.status(400).json({ error: 'No Jellyfin server configured' })
    return
  }

  const baseUrl = ctx.config.server_url
  const forceFullSync = req.query.force === 'true'

  if (forceFullSync) {
    db.prepare('DELETE FROM sync_meta WHERE server_url = ?').run(baseUrl)
  }

  const insert = db.prepare(`
    INSERT OR IGNORE INTO playback_history (server_url, user_id, item_id, item_name, item_type, date_played)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  interface JfUser { Id: string; Name: string }
  let jfUsers: JfUser[] = []
  try {
    const { data } = await getUserApi(ctx.api).getUsers()
    jfUsers = data.map((u) => ({ Id: u.Id || '', Name: u.Name || '' })).filter((u) => u.Id)
  } catch {
    jfUsers = []
  }
  if (jfUsers.length === 0) {
    jfUsers = [{ Id: ctx.config.jellyfin_user_id, Name: 'Admin' }]
  }

  const BATCH_SIZE = 500
  let grandTotalInserted = 0

  try {
    for (const jfUser of jfUsers) {
      const userId = jfUser.Id

      const meta = db
        .prepare('SELECT last_sync FROM sync_meta WHERE server_url = ? AND user_id = ?')
        .get(baseUrl, userId) as { last_sync: string } | undefined

      let startIndex = 0
      let done = false
      let userInserted = 0
      let maxDatePlayed: string | null = null

      while (!done) {
        const { data } = await getItemsApi(ctx.api).getItems({
          userId,
          sortBy: [ItemSortBy.DatePlayed],
          sortOrder: [SortOrder.Descending],
          filters: [ItemFilter.IsPlayed],
          includeItemTypes: [
            BaseItemKind.Movie,
            BaseItemKind.Episode,
            BaseItemKind.Audio,
            BaseItemKind.MusicAlbum,
          ],
          limit: BATCH_SIZE,
          startIndex,
          recursive: true,
          enableUserData: true,
        })

        const items = data.Items || []

        if (startIndex === 0) {
          console.log(`[HistorySync] User ${jfUser.Name}: ${data.TotalRecordCount ?? items.length} played items found`)
        }

        if (items.length === 0) break

        const insertBatch = db.transaction(
          (batch: typeof items) => {
            for (const item of batch) {
              const datePlayed = item.UserData?.LastPlayedDate || new Date().toISOString()

              if (meta?.last_sync && datePlayed <= meta.last_sync) {
                if (item.UserData?.LastPlayedDate) {
                  done = true
                  break
                }
                continue
              }
              insert.run(baseUrl, userId, item.Id, item.Name, item.Type, datePlayed)
              userInserted++
              if (!maxDatePlayed || datePlayed > maxDatePlayed) {
                maxDatePlayed = datePlayed
              }
            }
          },
        )

        insertBatch(items)
        if (items.length < BATCH_SIZE) break
        startIndex += BATCH_SIZE
      }

      console.log(`[HistorySync] User ${jfUser.Name}: ${userInserted} new entries synced`)

      grandTotalInserted += userInserted

      if (maxDatePlayed) {
        db.prepare(
          `INSERT INTO sync_meta (server_url, user_id, last_sync, total_synced)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(server_url, user_id) DO UPDATE SET
             last_sync = excluded.last_sync,
             total_synced = total_synced + excluded.total_synced`,
        ).run(baseUrl, userId, maxDatePlayed, userInserted)
      }
    }

    const total = (
      db
        .prepare('SELECT COUNT(*) as cnt FROM playback_history WHERE server_url = ?')
        .get(baseUrl) as { cnt: number }
    ).cnt

    res.json({ success: true, newEntries: grandTotalInserted, totalEntries: total, usersSynced: jfUsers.length })
  } catch (err) {
    res.status(502).json({ error: `Sync error: ${jellyfinErrorMessage(err)}` })
  }
})

app.post('/api/history/track-sessions', requireAuth, (req, res) => {
  const config = getJellyfinConfig(req.user!.id)
  if (!config) {
    res.status(400).json({ error: 'No Jellyfin server configured' })
    return
  }

  const { sessions } = req.body as {
    sessions?: {
      userId: string
      userName: string
      itemId: string
      itemName: string
      itemType: string
      client: string
    }[]
  }

  if (!sessions || sessions.length === 0) {
    res.json({ tracked: 0 })
    return
  }

  const baseUrl = config.server_url
  const now = new Date().toISOString()
  const hourKey = now.slice(0, 13) + ':00:00.000Z'

  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO playback_history (server_url, user_id, item_id, item_name, item_type, date_played)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  let tracked = 0
  const insertBatch = db.transaction(() => {
    for (const s of sessions) {
      try {
        insertStmt.run(baseUrl, s.userId, s.itemId, s.itemName, s.itemType, hourKey)
        tracked++
      } catch {
        // duplicate
      }
    }
  })

  insertBatch()

  if (tracked > 0) {
    console.log(`[SessionTrack] Recorded ${tracked} playback events`)
  }

  res.json({ tracked })
})

app.get('/api/history/analytics', requireAuth, (req, res) => {
  const config = getJellyfinConfig(req.user!.id)
  if (!config) {
    console.log('[Analytics] No Jellyfin config found for user')
    res.json({ historyMap: {}, peakHours: Array(24).fill(0), totalPlays: 0 })
    return
  }

  const rows = db
    .prepare(
      `SELECT date_played FROM playback_history
       WHERE server_url = ?
       ORDER BY date_played`,
    )
    .all(config.server_url) as {
    date_played: string
  }[]

  const historyMap: Record<string, number> = {}
  const peakHours = Array(24).fill(0) as number[]
  let parseErrors = 0

  for (const row of rows) {
    const d = new Date(row.date_played)
    if (isNaN(d.getTime())) {
      parseErrors++
      continue
    }
    const dateKey = d.toISOString().split('T')[0]
    historyMap[dateKey] = (historyMap[dateKey] || 0) + 1
    peakHours[d.getHours()] += 1
  }

  console.log(`[Analytics] ${rows.length} total rows, ${Object.keys(historyMap).length} days, ${parseErrors} parse errors`)
  res.json({ historyMap, peakHours, totalPlays: rows.length })
})

function resolveImageAuth(req: Request): string | null {
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const session = db.prepare('SELECT user_id, expires_at FROM sessions WHERE token = ?').get(token) as
      | { user_id: string; expires_at: string } | undefined
    if (session && new Date(session.expires_at) > new Date()) return session.user_id
  }
  const qToken = req.query.token as string | undefined
  if (qToken) {
    const session = db.prepare('SELECT user_id, expires_at FROM sessions WHERE token = ?').get(qToken) as
      | { user_id: string; expires_at: string } | undefined
    if (session && new Date(session.expires_at) > new Date()) return session.user_id
  }
  return null
}

app.get('/api/jellyfin/image', async (req, res) => {
  const { itemId, type = 'Primary' } = req.query as Record<string, string>

  if (!itemId) { res.status(400).end(); return }

  const userId = resolveImageAuth(req)
  if (!userId) { res.status(401).end(); return }

  const config = getJellyfinConfig(userId)
  if (!config) { res.status(400).end(); return }

  try {
    const url = `${config.server_url}/Items/${itemId}/Images/${type}?fillHeight=800&fillWidth=800&quality=90`
    const response = await fetch(url)

    if (!response.ok) { res.status(response.status).end(); return }

    const contentType = response.headers.get('content-type')
    if (contentType) res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=86400')

    const buffer = Buffer.from(await response.arrayBuffer())
    res.send(buffer)
  } catch {
    res.status(502).end()
  }
})

app.get('/api/jellyfin/user-image', async (req, res) => {
  const { userId: jellyfinUserId } = req.query as Record<string, string>

  if (!jellyfinUserId) { res.status(400).end(); return }

  const userId = resolveImageAuth(req)
  if (!userId) { res.status(401).end(); return }

  const config = getJellyfinConfig(userId)
  if (!config) { res.status(400).end(); return }

  try {
    const url = `${config.server_url}/Users/${jellyfinUserId}/Images/Primary?fillHeight=200&fillWidth=200&quality=90`
    const response = await fetch(url)

    if (!response.ok) { res.status(response.status).end(); return }

    const contentType = response.headers.get('content-type')
    if (contentType) res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=86400')

    const buffer = Buffer.from(await response.arrayBuffer())
    res.send(buffer)
  } catch {
    res.status(502).end()
  }
})

app.get('/api/pulse-stats', requireAuth, (req, res) => {
  const config = getJellyfinConfig(req.user!.id)

  let dbSizeBytes = 0
  try {
    dbSizeBytes = fs.statSync(DB_FILE_PATH).size
  } catch {
    // ignore
  }

  let totalHistoryEntries = 0
  let lastSyncTime: string | null = null

  if (config) {
    totalHistoryEntries = (
      db
        .prepare('SELECT COUNT(*) as cnt FROM playback_history WHERE server_url = ?')
        .get(config.server_url) as { cnt: number }
    ).cnt

    const meta = db
      .prepare('SELECT MAX(last_sync) as last_sync FROM sync_meta WHERE server_url = ?')
      .get(config.server_url) as { last_sync: string } | undefined

    lastSyncTime = meta?.last_sync ?? null
  }

  res.json({ dbSizeBytes, totalHistoryEntries, lastSyncTime })
})

app.get('/api/genres', requireAuth, async (req, res) => {
  const ctx = getApiForUser(req.user!.id)
  if (!ctx) {
    res.json({ genres: [] })
    return
  }

  try {
    const { data } = await getItemsApi(ctx.api).getItems({
      userId: ctx.config.jellyfin_user_id,
      recursive: true,
      includeItemTypes: [BaseItemKind.Movie, BaseItemKind.Series],
      fields: [ItemFields.Genres],
      limit: 2000,
    })

    const genreMap: Record<string, number> = {}
    let totalItems = 0

    for (const item of data.Items ?? []) {
      if (item.Genres && item.Genres.length > 0) {
        totalItems++
        for (const genre of item.Genres) {
          genreMap[genre] = (genreMap[genre] || 0) + 1
        }
      }
    }

    const sorted = Object.entries(genreMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, count]) => ({
        name,
        count,
        pct: totalItems > 0 ? Math.round((count / totalItems) * 100) : 0,
      }))

    res.json({ genres: sorted })
  } catch {
    res.json({ genres: [] })
  }
})

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'finscope-proxy' })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`FinScope Proxy running on port ${PORT}`)
  console.log(`SQLite DB ready`)
})
