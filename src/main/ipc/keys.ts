import { CH } from '@shared/ipc-channels'
import type { KeyInfo, ScanResult } from '@shared/types'
import type Redis from 'ioredis'
import { withClient } from './handle'

async function resolveKeyInfo(client: Redis, key: string): Promise<KeyInfo> {
  const [type, ttl] = await Promise.all([client.type(key), client.ttl(key)])
  return { key, type: type as KeyInfo['type'], ttl }
}

export function registerKeyHandlers(): void {
  withClient(CH.KEYS_SCAN, async (client, pattern, cursor, count) => {
    const [nextCursor, keys] = await client.scan(
      cursor as string, 'MATCH', pattern as string, 'COUNT', count as number,
    )
    const keyInfos = await Promise.all(keys.map((k) => resolveKeyInfo(client, k)))
    return { keys: keyInfos, cursor: nextCursor } satisfies ScanResult
  })

  withClient(CH.KEYS_TYPE,    (client, key)             => resolveKeyInfo(client, key as string))
  withClient(CH.KEYS_DELETE,  (client, keys)             => client.del(...(keys as string[])))
  withClient(CH.KEYS_TTL,     (client, key)              => client.ttl(key as string))
  withClient(CH.KEYS_EXPIRE,  (client, key, seconds)     => client.expire(key as string, seconds as number))
  withClient(CH.KEYS_PERSIST, (client, key)              => client.persist(key as string))
  withClient(CH.KEYS_RENAME,  (client, oldKey, newKey)   => client.rename(oldKey as string, newKey as string))
}
