import { create } from 'zustand'
import type { RedisConnection, RedisConnectionStatus } from '@shared/types'
import { ipc } from '../lib/ipc'

interface ConnectionsState {
  connections:        RedisConnection[]
  statuses:           Record<string, RedisConnectionStatus>
  activeConnectionId: string | null
  loaded:             boolean

  load:             () => Promise<void>
  addConnection:    (conn: Omit<RedisConnection, 'id' | 'createdAt'>) => Promise<RedisConnection>
  updateConnection: (id: string, patch: Partial<Omit<RedisConnection, 'id' | 'createdAt'>>) => Promise<void>
  removeConnection: (id: string) => Promise<void>
  setStatus:        (id: string, status: RedisConnectionStatus) => void
  setActive:        (id: string | null) => void
}

export const useConnectionsStore = create<ConnectionsState>((set) => ({
  connections:        [],
  statuses:           {},
  activeConnectionId: null,
  loaded:             false,

  load: async () => {
    const result = await ipc.connection.list()
    if (result.ok) set({ connections: result.data, loaded: true })
  },

  addConnection: async (conn) => {
    const result = await ipc.connection.create(conn)
    if (!result.ok) throw new Error(result.error)
    set((s) => ({ connections: [...s.connections, result.data] }))
    return result.data
  },

  updateConnection: async (id, patch) => {
    const result = await ipc.connection.update(id, patch)
    if (!result.ok) throw new Error(result.error)
    set((s) => ({
      connections: s.connections.map((c) => (c.id === id ? result.data : c)),
    }))
  },

  removeConnection: async (id) => {
    const result = await ipc.connection.remove(id)
    if (!result.ok) throw new Error(result.error)
    set((s) => ({
      connections:        s.connections.filter((c) => c.id !== id),
      statuses:           Object.fromEntries(Object.entries(s.statuses).filter(([k]) => k !== id)),
      activeConnectionId: s.activeConnectionId === id ? null : s.activeConnectionId,
    }))
  },

  setStatus: (id, status) => set((s) => ({ statuses: { ...s.statuses, [id]: status } })),
  setActive:  (id)         => set({ activeConnectionId: id }),
}))
