import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { runMigrations } from './migrations'

let db: Database.Database

export function initDb(): void {
  const path = join(app.getPath('userData'), 'redix.db')
  db = new Database(path)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  runMigrations(db)
}

export function getDb(): Database.Database {
  return db
}
