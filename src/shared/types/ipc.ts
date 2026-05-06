import type { RedisConnection, RedisConnectionStatus } from './connection'

// Proper discriminated union — TypeScript can narrow on `result.ok`
export type IpcOk<T>  = T extends void ? { ok: true } : { ok: true; data: T }
export type IpcErr    = { ok: false; error: string }
export type IpcResult<T = void> = IpcOk<T> | IpcErr

export interface KeyInfo {
  key:   string
  type:  'string' | 'hash' | 'list' | 'set' | 'zset' | 'stream' | 'unknown'
  ttl:   number
  size?: number
}

export interface ScanResult {
  keys:    KeyInfo[]
  cursor:  string
  total?:  number
}

export interface ZSetEntry {
  member: string
  score:  number
}

export interface ServerInfo {
  version:                string
  mode:                   string
  os:                     string
  uptimeSeconds:          number
  connectedClients:       number
  usedMemoryHuman:        string
  totalCommandsProcessed: number
  keyspaceHits:           number
  keyspaceMisses:         number
  opsPerSec:              number
  totalSystemMemoryHuman: string
}

/** Typed API exposed by the preload bridge via contextBridge. */
export interface ElectronAPI {
  connection: {
    // CRUD — backed by SQLite on the main process
    list:   ()                                                                      => Promise<IpcResult<RedisConnection[]>>
    create: (conn: Omit<RedisConnection, 'id' | 'createdAt'>)                      => Promise<IpcResult<RedisConnection>>
    update: (id: string, patch: Partial<Omit<RedisConnection, 'id' | 'createdAt'>>) => Promise<IpcResult<RedisConnection>>
    remove: (id: string)                                                            => Promise<IpcResult>
    // Redis client lifecycle
    test:   (conn: Omit<RedisConnection, 'id' | 'createdAt'>)  => Promise<IpcResult>
    open:   (id: string)                                         => Promise<IpcResult<RedisConnectionStatus>>
    close:  (id: string)                                         => Promise<IpcResult>
    status: (id: string)                                         => Promise<IpcResult<RedisConnectionStatus>>
  }
  keys: {
    scan:    (connectionId: string, pattern: string, cursor: string, count: number) => Promise<IpcResult<ScanResult>>
    type:    (connectionId: string, key: string)                                    => Promise<IpcResult<KeyInfo>>
    delete:  (connectionId: string, keys: string[])                                 => Promise<IpcResult<number>>
    ttl:     (connectionId: string, key: string)                                    => Promise<IpcResult<number>>
    expire:  (connectionId: string, key: string, seconds: number)                   => Promise<IpcResult>
    persist: (connectionId: string, key: string)                                    => Promise<IpcResult>
  }
  string: {
    get: (connectionId: string, key: string)                           => Promise<IpcResult<string>>
    set: (connectionId: string, key: string, value: string, ttl?: number) => Promise<IpcResult>
  }
  hash: {
    getAll: (connectionId: string, key: string)                                => Promise<IpcResult<Record<string, string>>>
    set:    (connectionId: string, key: string, field: string, value: string)  => Promise<IpcResult>
    del:    (connectionId: string, key: string, field: string)                 => Promise<IpcResult>
  }
  list: {
    range: (connectionId: string, key: string, start: number, stop: number)           => Promise<IpcResult<string[]>>
    push:  (connectionId: string, key: string, value: string, side: 'left' | 'right') => Promise<IpcResult>
    set:   (connectionId: string, key: string, index: number, value: string)          => Promise<IpcResult>
  }
  set: {
    members: (connectionId: string, key: string)                  => Promise<IpcResult<string[]>>
    add:     (connectionId: string, key: string, member: string)  => Promise<IpcResult>
    remove:  (connectionId: string, key: string, member: string)  => Promise<IpcResult>
  }
  zset: {
    range:  (connectionId: string, key: string, start: number, stop: number) => Promise<IpcResult<ZSetEntry[]>>
    add:    (connectionId: string, key: string, score: number, member: string) => Promise<IpcResult>
    remove: (connectionId: string, key: string, member: string)                => Promise<IpcResult>
  }
  cli: {
    execute: (connectionId: string, command: string) => Promise<IpcResult<string>>
  }
  server: {
    info:    (connectionId: string) => Promise<IpcResult<ServerInfo>>
    dbSize:  (connectionId: string) => Promise<IpcResult<number>>
    flushDb: (connectionId: string) => Promise<IpcResult>
  }
  app: {
    version: () => Promise<string>
  }
}
