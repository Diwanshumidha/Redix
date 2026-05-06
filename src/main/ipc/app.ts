import { ipcMain, app } from 'electron'
import { CH } from '@shared/ipc-channels'

export function registerAppHandlers(): void {
  ipcMain.handle(CH.APP_VERSION, () => app.getVersion())
}
