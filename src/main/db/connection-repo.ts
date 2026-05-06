import { getDb } from './index'
import type { RedisConnection, RedisConnectionType } from '@shared/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToConn(row: any): RedisConnection {
  return {
    id:        row.id,
    name:      row.name,
    host:      row.host,
    port:      row.port,
    password:  row.password  ?? undefined,
    username:  row.username  ?? undefined,
    db:        row.db,
    tls:       row.tls === 1,
    type:      row.type as RedisConnectionType,
    createdAt: row.created_at,
  }
}

export const ConnectionRepo = {
  list(): RedisConnection[] {
    return (getDb()
      .prepare('SELECT * FROM connections ORDER BY created_at ASC')
      .all() as unknown[])
      .map(rowToConn)
  },

  findById(id: string): RedisConnection | undefined {
    const row = getDb()
      .prepare('SELECT * FROM connections WHERE id = ?')
      .get(id)
    return row ? rowToConn(row) : undefined
  },

  create(conn: RedisConnection): RedisConnection {
    getDb().prepare(`
      INSERT INTO connections
        (id, name, host, port, password, username, db, tls, type, created_at)
      VALUES
        (@id, @name, @host, @port, @password, @username, @db, @tls, @type, @created_at)
    `).run({
      id:         conn.id,
      name:       conn.name,
      host:       conn.host,
      port:       conn.port,
      password:   conn.password  ?? null,
      username:   conn.username  ?? null,
      db:         conn.db,
      tls:        conn.tls ? 1 : 0,
      type:       conn.type,
      created_at: conn.createdAt,
    })
    return conn
  },

  update(id: string, patch: Partial<Omit<RedisConnection, 'id' | 'createdAt'>>): RedisConnection {
    const existing = ConnectionRepo.findById(id)
    if (!existing) throw new Error(`Connection "${id}" not found`)
    const merged = { ...existing, ...patch }
    getDb().prepare(`
      UPDATE connections
      SET name = @name, host = @host, port = @port,
          password = @password, username = @username,
          db = @db, tls = @tls, type = @type
      WHERE id = @id
    `).run({
      id,
      name:     merged.name,
      host:     merged.host,
      port:     merged.port,
      password: merged.password ?? null,
      username: merged.username ?? null,
      db:       merged.db,
      tls:      merged.tls ? 1 : 0,
      type:     merged.type,
    })
    return merged
  },

  remove(id: string): void {
    getDb().prepare('DELETE FROM connections WHERE id = ?').run(id)
  },
}
