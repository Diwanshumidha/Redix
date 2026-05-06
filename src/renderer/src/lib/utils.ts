export function cn(...classes: Array<string | undefined | null | false>): string {
  return classes.filter((c): c is string => Boolean(c)).join(' ')
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`
}

export function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const parts: string[] = []
  if (d) parts.push(`${d}d`)
  if (h) parts.push(`${h}h`)
  if (m) parts.push(`${m}m`)
  return parts.join(' ') || '< 1m'
}

export function keyTypeColor(type: string): string {
  const map: Record<string, string> = {
    string: 'text-[var(--color-green)]',
    hash:   'text-[var(--color-blue)]',
    list:   'text-[var(--color-yellow)]',
    set:    'text-[var(--color-peach)]',
    zset:   'text-[var(--color-mauve)]',
    stream: 'text-[var(--color-sapphire)]',
  }
  return map[type] ?? 'text-[var(--color-overlay-1)]'
}

export function keyTypeBadge(type: string): string {
  const map: Record<string, string> = {
    string: 'STR',
    hash:   'HASH',
    list:   'LIST',
    set:    'SET',
    zset:   'ZSET',
    stream: 'STRM',
  }
  return map[type] ?? type.toUpperCase()
}
