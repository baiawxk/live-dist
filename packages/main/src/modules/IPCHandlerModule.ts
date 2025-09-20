import type { AppModule } from '../AppModule.js'
import type { ModuleContext } from '../ModuleContext.js'
import { IPCHandler } from './IPCHandler.js'

export function createIPCHandlerModule(): AppModule {
  let ipcHandler: IPCHandler

  return {
    enable(context: ModuleContext) {
      ipcHandler = new IPCHandler()

      context.app.on('before-quit', () => {
        ipcHandler?.cleanup()
      })
    }
  }
}
