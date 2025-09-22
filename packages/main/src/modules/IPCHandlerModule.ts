import type { AppModule } from '../AppModule.js'
import type { ModuleContext } from '../ModuleContext.js'
import { registerIPCFunctions } from 'virtual:ipc-main'

export function createIPCHandlerModule(): AppModule {
  return {
    enable(context: ModuleContext) {
      // 注册IPC函数
      registerIPCFunctions()

      // 在应用退出前不需要特殊清理，因为IPC处理是自动管理的
      context.app.on('before-quit', () => {
        // 任何需要在退出前执行的清理代码可以放在这里
      })
    },
  }
}
