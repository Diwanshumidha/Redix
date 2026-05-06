import type Database from 'better-sqlite3'

export function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS connections (
      id         TEXT    PRIMARY KEY,
      name       TEXT    NOT NULL,
      host       TEXT    NOT NULL,
      port       INTEGER NOT NULL DEFAULT 6379,
      password   TEXT,
      username   TEXT,
      db         INTEGER NOT NULL DEFAULT 0,
      tls        INTEGER NOT NULL DEFAULT 0,
      type       TEXT    NOT NULL DEFAULT 'standalone',
      created_at INTEGER NOT NULL
    );
  `)
}
