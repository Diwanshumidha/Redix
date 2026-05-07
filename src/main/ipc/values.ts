import { CH } from '@shared/ipc-channels'
import { withClient } from './handle'

export function registerValueHandlers(): void {
  // ── String ───────────────────────────────────────────────────────────────
  withClient(CH.STR_GET, (client, key)                => client.get(key as string).then((v) => v ?? ''))
  withClient(CH.STR_SET, (client, key, value, ttl)    =>
    (ttl as number) > 0
      ? client.set(key as string, value as string, 'EX', ttl as number)
      : client.set(key as string, value as string),
  )

  // ── Hash ─────────────────────────────────────────────────────────────────
  withClient(CH.HASH_GETALL, (client, key)                    => client.hgetall(key as string))
  withClient(CH.HASH_SET,    (client, key, field, value)      => client.hset(key as string, field as string, value as string))
  withClient(CH.HASH_DEL,    (client, key, field)             => client.hdel(key as string, field as string))

  // ── List ─────────────────────────────────────────────────────────────────
  withClient(CH.LIST_RANGE, (client, key, start, stop)  => client.lrange(key as string, start as number, stop as number))
  withClient(CH.LIST_SET,   (client, key, index, value) => client.lset(key as string, index as number, value as string))
  withClient(CH.LIST_REM,   async (client, key, index) => {
    const sentinel = `\x00__rem_${Date.now()}__\x00`
    await client.lset(key as string, index as number, sentinel)
    return client.lrem(key as string, 1, sentinel)
  })
  withClient(CH.LIST_PUSH,  (client, key, value, side)  =>
    side === 'left'
      ? client.lpush(key as string, value as string)
      : client.rpush(key as string, value as string),
  )

  // ── Set ──────────────────────────────────────────────────────────────────
  withClient(CH.SET_MEMBERS, (client, key)         => client.smembers(key as string))
  withClient(CH.SET_ADD,     (client, key, member) => client.sadd(key as string, member as string))
  withClient(CH.SET_REMOVE,  (client, key, member) => client.srem(key as string, member as string))

  // ── Sorted Set ───────────────────────────────────────────────────────────
  withClient(CH.ZSET_RANGE, async (client, key, start, stop) => {
    const raw = await client.zrange(key as string, start as number, stop as number, 'WITHSCORES')
    const entries: Array<{ member: string; score: number }> = []
    for (let i = 0; i < raw.length; i += 2)
      entries.push({ member: raw[i], score: Number.parseFloat(raw[i + 1]) })
    return entries
  })
  withClient(CH.ZSET_ADD,    (client, key, score, member) => client.zadd(key as string, score as number, member as string))
  withClient(CH.ZSET_REMOVE, (client, key, member)        => client.zrem(key as string, member as string))
}
