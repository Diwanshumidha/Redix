import { useState, useCallback } from 'react'

export interface RecentKey {
  key:  string
  type: string
}

const MAX = 12

export function useRecentKeys() {
  const [recentKeys, setRecentKeys] = useState<RecentKey[]>([])

  const addRecent = useCallback((key: string, type: string) => {
    setRecentKeys((prev) => {
      const filtered = prev.filter((r) => r.key !== key)
      return [{ key, type }, ...filtered].slice(0, MAX)
    })
  }, [])

  return { recentKeys, addRecent }
}
