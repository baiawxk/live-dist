import type { AppModule } from '../AppModule.js'
import type { ModuleContext } from '../ModuleContext.js'
import { setupAutoIPCHandler, cleanupAutoIPC } from './AutoIPCHandler.js'

export function createIPCHandlerModule(): AppModule {
  return {
    enable(context: ModuleContext) {
      // 设置自动 IPC 处理器
      setupAutoIPCHandler()

      context.app.on('before-quit', async () => {
        await cleanupAutoIPC()
      })
    },
  }
}
