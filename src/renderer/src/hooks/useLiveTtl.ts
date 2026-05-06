import { useState, useEffect } from 'react'

/* ── Single shared 1-second tick — one interval drives all subscribers ── */
type Listener = () => void
const listeners = new Set<Listener>()
let timerId: ReturnType<typeof setInterval> | null = null

function subscribe(fn: Listener): () => void {
  if (listeners.size === 0) {
    timerId = setInterval(() => {
      for (const f of listeners) f()
    }, 1000)
  }
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
    if (listeners.size === 0 && timerId !== null) {
      clearInterval(timerId)
      timerId = null
    }
  }
}

export function useLiveTtl(initial: number): number {
  const [remaining, setRemaining] = useState(initial)

  useEffect(() => { setRemaining(initial) }, [initial])

  useEffect(() => {
    if (initial < 0) return
    let current = initial
    return subscribe(() => {
      current = Math.max(0, current - 1)
      setRemaining(current)
    })
  }, [initial])

  return remaining
}

export function formatTtl(seconds: number): {
  label: string
  state: 'persistent' | 'expiring' | 'ok' | 'expired'
} {
  if (seconds < 0)   return { label: '∞',       state: 'persistent' }
  if (seconds === 0) return { label: 'expired',  state: 'expired' }
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  let label: string
  if (h > 0)      label = `${h}h ${m}m ${s}s`
  else if (m > 0) label = `${m}m ${s}s`
  else            label = `${s}s`
  return { label, state: seconds < 60 ? 'expiring' : 'ok' }
}
