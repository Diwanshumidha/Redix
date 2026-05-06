import { CH } from '@shared/ipc-channels'
import type { RedisConnection } from '@shared/types'
import { ConnectionRepo } from '../db/connection-repo'
import { createClient, disconnectClient, getClient, isConnected } from '../redis/client-manager'
import { handle } from './handle'

export function registerConnectionHandlers(): void {
  // ── CRUD (SQLite) ───────────────────────────────────────────────────────

  handle(CH.CONN_LIST,   ()                                                                       => ConnectionRepo.list())
  handle(CH.CONN_CREATE, (conn: unknown)                                                           => {
    const c = conn as Omit<RedisConnection, 'id' | 'createdAt'>
    return ConnectionRepo.create({ ...c, id: crypto.randomUUID(), createdAt: Date.now() })
  })
  handle(CH.CONN_UPDATE, (id: unknown, patch: unknown)                                             =>
    ConnectionRepo.update(id as string, patch as Partial<Omit<RedisConnection, 'id' | 'createdAt'>>)
  )
  handle(CH.CONN_DELETE, (id: unknown) => {
    disconnectClient(id as string)
    ConnectionRepo.remove(id as string)
  })

  // ── Redis client lifecycle ──────────────────────────────────────────────

  handle(CH.CONN_TEST, async (conn: unknown) => {
    const c = conn as Omit<RedisConnection, 'id' | 'createdAt'>
    await createClient({ ...c, id: '__test__', createdAt: Date.now() })
    disconnectClient('__test__')
  })

  handle(CH.CONN_OPEN, async (id: unknown) => {
    const conn = ConnectionRepo.findById(id as string)
    if (!conn) throw new Error(`Connection "${id as string}" not found`)
    await createClient(conn)
    return { id: conn.id, connected: true }   })

  handle(CH.CONN_CLOSE,  (id: unknown) => disconnectClient(id as string))

  handle(CH.CONN_STATUS, async (id: unknown) => {
    const sid = id as string
    const connected = isConnected(sid)
    let latency: number | undefined
    if (connected) {
      const t = Date.now()
      await getClient(sid)!.ping()
      latency = Date.now() - t
    }
    return { id: sid, connected, latency }   })
}
