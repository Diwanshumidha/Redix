import { ipcMain } from 'electron'
import type Redis from 'ioredis'
import { getClient } from '../redis/client-manager'

// ─── Result constructors (used only in the main process) ───────────────────

const ok  = <T>(data: T)    => ({ ok: true  as const, data })
const err = (e: unknown)    => ({ ok: false as const, error: e instanceof Error ? e.message : String(e) })

// ─── handle ────────────────────────────────────────────────────────────────
// Wraps ipcMain.handle: auto-catches any thrown error into { ok: false }.
// fn receives the IPC args (no event) and should return a plain value —
// wrapping into { ok: true, data } is done here.

export function handle(
  channel: string,
  fn: (...args: unknown[]) => unknown,
): void {
  ipcMain.handle(channel, async (_event, ...args) => {
    try {
      return ok(await fn(...args))
    } catch (e) {
      return err(e)
    }
  })
}

// ─── withClient ────────────────────────────────────────────────────────────
// Like handle, but the first IPC arg must be a connectionId string.
// Resolves the Redis client before calling fn; throws if not connected.

export function withClient(
  channel: string,
  fn: (client: Redis, ...args: unknown[]) => unknown,
): void {
  handle(channel, async (connectionId, ...rest) => {
    const client = getClient(connectionId as string)
    if (!client) throw new Error('Not connected to Redis')
    return fn(client, ...rest)
  })
}
