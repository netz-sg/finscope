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

const avatarDir = path.resolve(path.dirname(DB_PATH), 'avatars')
fs.mkdirSync(avatarDir, { recursive: true })

export const AVATAR_DIR = avatarDir
export const DB_FILE_PATH = DB_PATH

export default db
