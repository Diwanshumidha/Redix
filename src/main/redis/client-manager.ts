import Redis from 'ioredis'
import type { RedisConnection } from '@shared/types'

const clients = new Map<string, Redis>()

export function getClient(id: string): Redis | undefined {
  return clients.get(id)
}

export async function createClient(conn: RedisConnection): Promise<Redis> {
  const existing = clients.get(conn.id)
  if (existing) {
    existing.disconnect()
    clients.delete(conn.id)
  }

  const client = new Redis({
    host: conn.host,
    port: conn.port,
    password: conn.password || undefined,
    username: conn.username || undefined,
    db: conn.db,
    tls: conn.tls ? {} : undefined,
    lazyConnect: true,
    connectTimeout: 5000,
    commandTimeout: 10000,
    maxRetriesPerRequest: 1,
    enableReadyCheck: true
  })

  await client.connect()
  clients.set(conn.id, client)
  return client
}

export function disconnectClient(id: string): void {
  const client = clients.get(id)
  if (client) {
    client.disconnect()
    clients.delete(id)
  }
}

export function isConnected(id: string): boolean {
  const client = clients.get(id)
  return client?.status === 'ready'
}
