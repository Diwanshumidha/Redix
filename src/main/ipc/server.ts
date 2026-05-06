import { CH } from '@shared/ipc-channels'
import type { ServerInfo } from '@shared/types'
import { withClient } from './handle'

export function registerServerHandlers(): void {
  withClient(CH.SRV_INFO, async (client) => {
    const raw = await client.info()
    const field = (key: string) =>
      new RegExp(`^${key}:(.+)$`, 'm').exec(raw)?.[1].trim() ?? ''

    return {
      version:                field('redis_version'),
      mode:                   field('redis_mode') || 'standalone',
      os:                     field('os'),
      uptimeSeconds:          Number.parseInt(field('uptime_in_seconds'))          || 0,
      connectedClients:       Number.parseInt(field('connected_clients'))          || 0,
      usedMemoryHuman:        field('used_memory_human'),
      totalCommandsProcessed: Number.parseInt(field('total_commands_processed'))   || 0,
      keyspaceHits:           Number.parseInt(field('keyspace_hits'))              || 0,
      keyspaceMisses:         Number.parseInt(field('keyspace_misses'))            || 0,
      opsPerSec:              Number.parseInt(field('instantaneous_ops_per_sec'))  || 0,
      totalSystemMemoryHuman: field('total_system_memory_human'),
    } satisfies ServerInfo
  })

  withClient(CH.SRV_DBSIZE, (client)  => client.dbsize())
  withClient(CH.SRV_FLUSH,  (client)  => client.flushdb())

  withClient(CH.CLI_EXEC, async (client, command) => {
    const [cmd, ...args] = (command as string).trim().split(/\s+/)
    // ioredis exposes `call` for arbitrary commands
    const result = await (client as unknown as { call: (cmd: string, ...a: string[]) => Promise<unknown> })
      .call(cmd, ...args)
    return JSON.stringify(result, null, 2)
  })
}
