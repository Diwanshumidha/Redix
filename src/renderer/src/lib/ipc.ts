import type { ElectronAPI } from '@shared/types'

// Single typed accessor for the bridge injected by the preload script.
// contextBridge.exposeInMainWorld puts it on window/globalThis in the renderer.
// Centralising the cast here means no renderer file ever touches window or globalThis directly.
export const ipc = (globalThis as typeof globalThis & { electron: ElectronAPI }).electron
