import Database, { type Database as DatabaseType } from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_PATH = process.env.DB_PATH || path.resolve(process.cwd(), 'data', 'finscope.db')

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })

const db: DatabaseType = new Database(DB_PATH)

db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS playback_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    server_url TEXT NOT NULL,
    user_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    item_name TEXT,
    item_type TEXT,
    date_played TEXT NOT NULL,
    UNIQUE(server_url, user_id, item_id, date_played)
  );

  CREATE INDEX IF NOT EXISTS idx_history_lookup
    ON playback_history(server_url, user_id, date_played);

  CREATE TABLE IF NOT EXISTS sync_meta (
    server_url TEXT NOT NULL,
    user_id TEXT NOT NULL,
    last_sync TEXT,
    total_synced INTEGER DEFAULT 0,
    PRIMARY KEY(server_url, user_id)
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    avatar_path TEXT,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

  CREATE TABLE IF NOT EXISTS notification_settings (
    user_id TEXT PRIMARY KEY,
    stream_start INTEGER NOT NULL DEFAULT 1,
    stream_end INTEGER NOT NULL DEFAULT 1,
    transcode_load INTEGER NOT NULL DEFAULT 0,
    server_error INTEGER NOT NULL DEFAULT 1,
    threshold_concurrent INTEGER NOT NULL DEFAULT 5,
    threshold_transcode INTEGER NOT NULL DEFAULT 3,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS webhook_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    platform TEXT NOT NULL CHECK(platform IN ('discord', 'telegram', 'slack')),
    webhook_url TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS notification_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read INTEGER NOT NULL DEFAULT 0,
    metadata TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_notification_log_user ON notification_log(user_id, created_at DESC);

  CREATE TABLE IF NOT EXISTS bandwidth_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    server_url TEXT NOT NULL,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    active_sessions INTEGER NOT NULL DEFAULT 0,
    transcode_sessions INTEGER NOT NULL DEFAULT 0,
    estimated_mbps REAL NOT NULL DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_bandwidth_ts ON bandwidth_snapshots(server_url, timestamp);

  CREATE TABLE IF NOT EXISTS jellyfin_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    server_url TEXT NOT NULL,
    api_key TEXT NOT NULL,
    jellyfin_user_id TEXT,
    server_name TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, server_url),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`)

try {
  db.exec(`ALTER TABLE playback_history ADD COLUMN position_ticks INTEGER DEFAULT 0`)
} catch {}

try {
  db.exec(`ALTER TABLE playback_history ADD COLUMN runtime_ticks INTEGER DEFAULT 0`)
} catch {}

try {
  db.exec(`ALTER TABLE notification_log ADD COLUMN metadata TEXT`)
} catch {}

const avatarDir = path.resolve(path.dirname(DB_PATH), 'avatars')
fs.mkdirSync(avatarDir, { recursive: true })

export const AVATAR_DIR = avatarDir
export const DB_FILE_PATH = DB_PATH

export default db
