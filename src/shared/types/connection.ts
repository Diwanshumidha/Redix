export type RedisConnectionType = 'standalone' | 'sentinel' | 'cluster'

export interface RedisConnection {
  id: string
  name: string
  host: string
  port: number
  password?: string
  username?: string
  db: number
  tls: boolean
  type: RedisConnectionType
  createdAt: number
}

export interface RedisConnectionStatus {
  id: string
  connected: boolean
  latency?: number
  error?: string
}
