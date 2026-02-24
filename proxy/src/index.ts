import express, { type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import crypto from 'crypto'
import path from 'path'
import fs from 'fs'
import bcrypt from 'bcryptjs'
import multer from 'multer'
import db, { AVATAR_DIR, DB_FILE_PATH } from './db.js'

/* ================================================================ */
/*  Express Setup                                                    */
/* ================================================================ */

const app = express()
const PORT = parseInt(process.env.PROXY_PORT || '3001', 10)

app.use(cors())
app.use(express.json())

/* ================================================================ */
/*  Types                                                            */
/* ================================================================ */

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

/* ================================================================ */
/*  Helpers                                                          */
/* ================================================================ */

const makeHeaders = (apiKey: string) => ({
  'X-Emby-Authorization': `MediaBrowser Client="FinScope", Device="Web", DeviceId="finscope-proxy-v1", Version="1.0.0", Token="${apiKey}"`,
  'Content-Type': 'application/json',
})

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

/** Look up the active Jellyfin config for a user */
function getJellyfinConfig(userId: string) {
  return db
    .prepare(
      'SELECT server_url, api_key, jellyfin_user_id, server_name FROM jellyfin_configs WHERE user_id = ? AND is_active = 1',
    )
    .get(userId) as
    | { server_url: string; api_key: string; jellyfin_user_id: string; server_name: string }
    | undefined
}

/* ================================================================ */
/*  Auth Middleware                                                   */
/* ================================================================ */

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

/* ================================================================ */
/*  Multer (Avatar Upload)                                           */
/* ================================================================ */

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

/* ================================================================ */
/*  SETUP ENDPOINTS (public)                                         */
/* ================================================================ */

app.get('/api/setup/status', (_req, res) => {
  const count = (db.prepare('SELECT COUNT(*) as cnt FROM users').get() as { cnt: number }).cnt
  res.json({ setupComplete: count > 0, hasUsers: count > 0 })
})

/* ================================================================ */
/*  AUTH ENDPOINTS                                                   */
/* ================================================================ */

// Register (only when no users exist yet — onboarding)
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

// Login
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

// Logout
app.post('/api/auth/logout', requireAuth, (req, res) => {
  const token = req.headers.authorization!.slice(7)
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token)
  res.json({ success: true })
})

// Get current user profile + jellyfin config
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

// Update profile
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

// Change password
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

// Upload avatar
app.post('/api/auth/avatar', requireAuth, upload.single('avatar'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' })
    return
  }

  const ext = req.file.mimetype === 'image/png' ? '.png' : req.file.mimetype === 'image/webp' ? '.webp' : '.jpg'
  const filename = `${req.user!.id}${ext}`
  const filePath = path.join(AVATAR_DIR, filename)

  // Remove old avatar files
  const oldFiles = fs.readdirSync(AVATAR_DIR).filter((f) => f.startsWith(req.user!.id))
  oldFiles.forEach((f) => fs.unlinkSync(path.join(AVATAR_DIR, f)))

  fs.writeFileSync(filePath, req.file.buffer)
  db.prepare('UPDATE users SET avatar_path = ?, updated_at = datetime(\'now\') WHERE id = ?').run(
    filename,
    req.user!.id,
  )

  res.json({ avatarUrl: `/api/auth/avatar/${req.user!.id}?t=${Date.now()}` })
})

// Delete avatar
app.delete('/api/auth/avatar', requireAuth, (req, res) => {
  const oldFiles = fs.readdirSync(AVATAR_DIR).filter((f) => f.startsWith(req.user!.id))
  oldFiles.forEach((f) => fs.unlinkSync(path.join(AVATAR_DIR, f)))

  db.prepare('UPDATE users SET avatar_path = NULL, updated_at = datetime(\'now\') WHERE id = ?').run(
    req.user!.id,
  )

  res.json({ success: true })
})

// Serve avatar (public — needed for img tags)
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

/* ================================================================ */
/*  JELLYFIN CONFIG ENDPOINTS                                        */
/* ================================================================ */

// Save/update Jellyfin config (validates connection first)
app.post('/api/jellyfin-config', requireAuth, async (req, res) => {
  const { serverUrl, apiKey } = req.body as { serverUrl?: string; apiKey?: string }

  if (!serverUrl || !apiKey) {
    res.status(400).json({ error: 'Missing serverUrl or apiKey' })
    return
  }

  const baseUrl = cleanUrl(serverUrl)

  // Validate connection
  try {
    const infoRes = await fetch(`${baseUrl}/System/Info`, {
      method: 'GET',
      headers: makeHeaders(apiKey),
    })
    if (!infoRes.ok) {
      res.status(400).json({ error: `Jellyfin returned ${infoRes.status} — check URL and API key` })
      return
    }

    const info = (await infoRes.json()) as { ServerName?: string }

    // Find the admin user on Jellyfin
    const usersRes = await fetch(`${baseUrl}/Users`, {
      method: 'GET',
      headers: makeHeaders(apiKey),
    })
    const jfUsers = usersRes.ok
      ? ((await usersRes.json()) as { Id: string; Policy?: { IsAdministrator?: boolean } }[])
      : []
    const adminJfUser = jfUsers.find((u) => u.Policy?.IsAdministrator) || jfUsers[0]
    const jfUserId = adminJfUser?.Id || ''

    // Upsert config
    db.prepare(
      `INSERT INTO jellyfin_configs (user_id, server_url, api_key, jellyfin_user_id, server_name)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(user_id, server_url) DO UPDATE SET
         api_key = excluded.api_key,
         jellyfin_user_id = excluded.jellyfin_user_id,
         server_name = excluded.server_name`,
    ).run(req.user!.id, baseUrl, apiKey, jfUserId, info.ServerName || 'Jellyfin')

    // Deactivate other configs, activate this one
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
    const message = err instanceof Error ? err.message : 'Connection failed'
    res.status(502).json({ error: message === 'fetch failed' ? 'Cannot reach Jellyfin server — check URL' : message })
  }
})

// Get Jellyfin config (masked API key)
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

/* ================================================================ */
/*  JELLYFIN PROXY (now with auth + DB lookup)                       */
/* ================================================================ */

app.get('/api/jellyfin', requireAuth, async (req, res) => {
  const { endpoint } = req.query as Record<string, string>

  if (!endpoint) {
    res.status(400).json({ error: 'Missing endpoint' })
    return
  }

  // Look up Jellyfin credentials from DB
  const config = getJellyfinConfig(req.user!.id)
  if (!config) {
    res.status(400).json({ error: 'No Jellyfin server configured' })
    return
  }

  try {
    const url = `${config.server_url}${endpoint}`
    const response = await fetch(url, {
      method: 'GET',
      headers: makeHeaders(config.api_key),
    })

    if (!response.ok) {
      res.status(response.status).json({ error: `Jellyfin returned ${response.status}` })
      return
    }

    const data = await response.json()
    res.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(502).json({ error: `Proxy error: ${message}` })
  }
})

/* ================================================================ */
/*  HISTORY SYNC (now with auth + DB lookup)                         */
/* ================================================================ */

app.post('/api/history/sync', requireAuth, async (req, res) => {
  const config = getJellyfinConfig(req.user!.id)
  if (!config) {
    res.status(400).json({ error: 'No Jellyfin server configured' })
    return
  }

  const baseUrl = config.server_url
  const headers = makeHeaders(config.api_key)
  const forceFullSync = req.query.force === 'true'

  // If force mode, clear all sync_meta for this server so we re-fetch everything
  if (forceFullSync) {
    db.prepare('DELETE FROM sync_meta WHERE server_url = ?').run(baseUrl)
  }

  const insert = db.prepare(`
    INSERT OR IGNORE INTO playback_history (server_url, user_id, item_id, item_name, item_type, date_played)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  // Fetch ALL Jellyfin users so we can sync every user's playback
  let jfUsers: { Id: string; Name: string }[] = []
  try {
    const usersRes = await fetch(`${baseUrl}/Users`, { method: 'GET', headers })
    if (usersRes.ok) {
      jfUsers = (await usersRes.json()) as { Id: string; Name: string }[]
    }
  } catch {
    // Fall back to configured user only
  }
  if (jfUsers.length === 0) {
    jfUsers = [{ Id: config.jellyfin_user_id, Name: 'Admin' }]
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
        // Use Filters=IsPlayed AND also request items with DatePlayed populated
        // Some Jellyfin versions don't populate DatePlayed with IsPlayed filter alone
        const endpoint = `/Users/${userId}/Items?SortBy=DatePlayed&SortOrder=Descending&Filters=IsPlayed&IncludeItemTypes=Movie,Episode,Audio,MusicAlbum&Limit=${BATCH_SIZE}&StartIndex=${startIndex}&Fields=DatePlayed&Recursive=true`
        const url = `${baseUrl}${endpoint}`
        const response = await fetch(url, { method: 'GET', headers })

        if (!response.ok) {
          console.error(`[HistorySync] Jellyfin returned ${response.status} for user ${jfUser.Name}`)
          break
        }

        const data = (await response.json()) as {
          Items?: { Id: string; Name: string; Type: string; DatePlayed?: string }[]
          TotalRecordCount?: number
        }
        const items = data.Items || []

        if (startIndex === 0) {
          console.log(`[HistorySync] User ${jfUser.Name}: ${data.TotalRecordCount ?? items.length} played items found`)
        }

        if (items.length === 0) break

        const insertBatch = db.transaction(
          (batch: { Id: string; Name: string; Type: string; DatePlayed?: string }[]) => {
            for (const item of batch) {
              // Use DatePlayed if available, otherwise fall back to current time
              // Many Jellyfin versions return IsPlayed items WITHOUT DatePlayed
              const datePlayed = item.DatePlayed || new Date().toISOString()

              // Only skip if we already synced past this point (incremental sync)
              if (meta?.last_sync && datePlayed <= meta.last_sync) {
                // Only stop pagination if we have a real DatePlayed (DESC order)
                if (item.DatePlayed) {
                  done = true
                  break
                }
                continue
              }
              insert.run(baseUrl, userId, item.Id, item.Name, item.Type, datePlayed)
              userInserted++
              // Track the newest item date (first item in DESC order is newest)
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

      // Update sync_meta per user — use max item date, NOT current time
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
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(502).json({ error: `Sync error: ${message}` })
  }
})

/* ================================================================ */
/*  LIVE SESSION TRACKING                                            */
/*  Records active sessions as playback events — more reliable than  */
/*  Jellyfin's IsPlayed history for analytics.                       */
/* ================================================================ */

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
  // Round to the nearest hour so we don't duplicate entries for the same session within the same hour
  const hourKey = now.slice(0, 13) + ':00:00.000Z'

  const insert = db.prepare(`
    INSERT OR IGNORE INTO playback_history (server_url, user_id, item_id, item_name, item_type, date_played)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  let tracked = 0
  const insertBatch = db.transaction(() => {
    for (const s of sessions) {
      try {
        insert.run(baseUrl, s.userId, s.itemId, s.itemName, s.itemType, hourKey)
        tracked++
      } catch {
        // UNIQUE constraint = already tracked this hour
      }
    }
  })

  insertBatch()

  if (tracked > 0) {
    console.log(`[SessionTrack] Recorded ${tracked} playback events`)
  }

  res.json({ tracked })
})

/* ================================================================ */
/*  ANALYTICS (now with auth + DB lookup)                            */
/* ================================================================ */

app.get('/api/history/analytics', requireAuth, (req, res) => {
  const config = getJellyfinConfig(req.user!.id)
  if (!config) {
    console.log('[Analytics] No Jellyfin config found for user')
    res.json({ historyMap: {}, peakHours: Array(24).fill(0), totalPlays: 0 })
    return
  }

  // Aggregate across ALL users on this server (no date cutoff — full history)
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

/* ================================================================ */
/*  IMAGE PROXIES                                                    */
/*  <img> tags can't send Authorization headers, so these endpoints  */
/*  accept the token as a query param (?token=...) as fallback.      */
/* ================================================================ */

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

/* ================================================================ */
/*  PULSE STATS (DB metrics for PulseView)                           */
/* ================================================================ */

app.get('/api/pulse-stats', requireAuth, (req, res) => {
  const config = getJellyfinConfig(req.user!.id)

  let dbSizeBytes = 0
  try {
    dbSizeBytes = fs.statSync(DB_FILE_PATH).size
  } catch {
    // DB file not accessible
  }

  let totalHistoryEntries = 0
  let lastSyncTime: string | null = null

  if (config) {
    // Count across ALL users on this server
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

/* ================================================================ */
/*  GENRE AGGREGATION                                                */
/* ================================================================ */

app.get('/api/genres', requireAuth, async (req, res) => {
  const config = getJellyfinConfig(req.user!.id)
  if (!config) {
    res.json({ genres: [] })
    return
  }

  try {
    const endpoint = `/Users/${config.jellyfin_user_id}/Items?Recursive=true&IncludeItemTypes=Movie,Series&Fields=Genres&Limit=2000`
    const url = `${config.server_url}${endpoint}`
    const response = await fetch(url, {
      method: 'GET',
      headers: makeHeaders(config.api_key),
    })

    if (!response.ok) {
      res.json({ genres: [] })
      return
    }

    const data = (await response.json()) as {
      Items?: { Genres?: string[] }[]
    }

    // Count genre occurrences
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

    // Sort by count, take top 8
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

/* ================================================================ */
/*  HEALTH                                                           */
/* ================================================================ */

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'finscope-proxy' })
})

/* ================================================================ */
/*  START                                                            */
/* ================================================================ */

app.listen(PORT, '0.0.0.0', () => {
  console.log(`FinScope Proxy running on port ${PORT}`)
  console.log(`SQLite DB ready`)
})
