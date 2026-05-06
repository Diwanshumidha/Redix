import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { ipc } from '../lib/ipc'
import type { KeyInfo } from '@shared/types'

/* ── Key scanning (infinite / paginated) ── */
export function useKeyScan(
  connectionId: string,
  pattern: string,
  count: number,
  enabled = true,
) {
  return useInfiniteQuery({
    queryKey: ['keys:scan', connectionId, pattern, count],
    queryFn: async ({ pageParam = '0' }) => {
      const r = await ipc.keys.scan(connectionId, pattern, pageParam as string, count)
      if (!r.ok) throw new Error(r.error)
      return r.data
    },
    getNextPageParam: (last) => (last.cursor !== '0' ? last.cursor : undefined),
    initialPageParam: '0',
    enabled: enabled && !!connectionId,
    staleTime: 30_000,
  })
}

/* ── Key type + TTL info ── */
export function useKeyInfo(connectionId: string, keyName: string | null) {
  return useQuery({
    queryKey: ['key:info', connectionId, keyName],
    queryFn: async () => {
      const r = await ipc.keys.type(connectionId, keyName!)
      if (!r.ok) throw new Error(r.error)
      return r.data
    },
    enabled: !!connectionId && !!keyName,
    staleTime: 30_000,
  })
}

type KeyValueResult = string | Record<string, string> | string[] | { member: string; score: number }[]

/* ── Key value (type-aware) ── */
export function useKeyValue(
  connectionId: string,
  keyName: string | null,
  type: string | undefined,
) {
  return useQuery({
    queryKey: ['key:value', connectionId, keyName, type],
    queryFn: async (): Promise<KeyValueResult> => {
      const key = keyName!
      switch (type) {
        case 'string': {
          const r = await ipc.string.get(connectionId, key)
          if (!r.ok) throw new Error(r.error)
          return r.data
        }
        case 'hash': {
          const r = await ipc.hash.getAll(connectionId, key)
          if (!r.ok) throw new Error(r.error)
          return r.data
        }
        case 'list': {
          const r = await ipc.list.range(connectionId, key, 0, -1)
          if (!r.ok) throw new Error(r.error)
          return r.data
        }
        case 'set': {
          const r = await ipc.set.members(connectionId, key)
          if (!r.ok) throw new Error(r.error)
          return r.data
        }
        case 'zset': {
          const r = await ipc.zset.range(connectionId, key, 0, -1)
          if (!r.ok) throw new Error(r.error)
          return r.data
        }
        default:
          throw new Error(`Unsupported type: ${type}`)
      }
    },
    enabled:
      !!connectionId &&
      !!keyName &&
      !!type &&
      !['unknown', 'stream'].includes(type),
    staleTime: 15_000,
  })
}

/* ── Server info with auto-refresh ── */
export function useServerInfo(connectionId: string, enabled = true) {
  return useQuery({
    queryKey: ['server:info', connectionId],
    queryFn: async () => {
      const r = await ipc.server.info(connectionId)
      if (!r.ok) throw new Error(r.error)
      return r.data
    },
    enabled: enabled && !!connectionId,
    refetchInterval: 5000,
    staleTime: 4000,
  })
}

/* ── DB key count ── */
export function useDbSize(connectionId: string) {
  return useQuery({
    queryKey: ['server:dbSize', connectionId],
    queryFn: async () => {
      const r = await ipc.server.dbSize(connectionId)
      if (!r.ok) throw new Error(r.error)
      return r.data
    },
    enabled: !!connectionId,
    refetchInterval: 10_000,
    staleTime: 9_000,
  })
}

/* ── Invalidation helpers ── */
export function useInvalidateKey() {
  const qc = useQueryClient()
  return (connectionId: string, keyName: string) => {
    qc.invalidateQueries({ queryKey: ['key:info',  connectionId, keyName] })
    qc.invalidateQueries({ queryKey: ['key:value', connectionId, keyName] })
  }
}

export function useInvalidateScan() {
  const qc = useQueryClient()
  return (connectionId: string) => {
    qc.invalidateQueries({ queryKey: ['keys:scan', connectionId] })
    qc.invalidateQueries({ queryKey: ['server:dbSize', connectionId] })
  }
}

/* ── Flat key list derived from infinite query pages ── */
export function flattenScanPages(data: ReturnType<typeof useKeyScan>['data']): KeyInfo[] {
  return data?.pages.flatMap((p) => p.keys) ?? []
}
