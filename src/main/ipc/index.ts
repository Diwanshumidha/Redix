import { registerConnectionHandlers } from './connection'
import { registerKeyHandlers } from './keys'
import { registerValueHandlers } from './values'
import { registerServerHandlers } from './server'
import { registerAppHandlers } from './app'

export function registerIpcHandlers(): void {
  registerConnectionHandlers()
  registerKeyHandlers()
  registerValueHandlers()
  registerServerHandlers()
  registerAppHandlers()
}
