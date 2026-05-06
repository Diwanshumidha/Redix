import { app, shell, BrowserWindow } from 'electron'
import { initDb } from './db'
import { createWindow } from './window'
import { registerIpcHandlers } from './ipc'

app.whenReady().then(() => {
  app.setAppUserModelId('io.codedecoders.redix')

  initDb()
  registerIpcHandlers()

  const mainWindow = createWindow()
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
