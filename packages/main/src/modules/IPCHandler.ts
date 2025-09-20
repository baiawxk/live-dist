import { ipcMain, dialog, shell } from 'electron'
import { DistConfig, DistManager } from './DistManager.js'
import { LiveServerManager } from './LiveServerManager.js'

export class IPCHandler {
  private distManager: DistManager
  private serverManager: LiveServerManager

  constructor() {
    this.distManager = new DistManager()
    this.serverManager = new LiveServerManager()
    this.setupHandlers()
  }

  private setupHandlers() {
    // 获取所有目录配置
    ipcMain.handle('get-all-dists', () => {
      return this.distManager.getAllDists()
    })

    // 添加新的目录配置
    ipcMain.handle('add-dist', (_, config: Omit<DistConfig, 'id' | 'isActive'>) => {
      return this.distManager.addDist(config)
    })

    // 更新目录配置
    ipcMain.handle('update-dist', (_, config: DistConfig) => {
      return this.distManager.updateDist(config.id, config)
    })

    // 删除目录配置
    ipcMain.handle('remove-dist', (_, id: string) => {
      return this.distManager.removeDist(id)
    })

    // 选择目录
    ipcMain.handle('select-directory', async () => {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory']
      })
      return result.canceled ? null : result.filePaths[0]
    })

    // 启动服务器
    ipcMain.handle('start-server', async (_, id: string) => {
      const dist = this.distManager.getDist(id)
      if (!dist) return false

      const success = await this.serverManager.startServer(dist)
      if (success) {
        this.distManager.updateDistStatus(id, true)
      }
      return success
    })

    // 停止服务器
    ipcMain.handle('stop-server', async (_, id: string) => {
      const success = await this.serverManager.stopServer(id)
      if (success) {
        this.distManager.updateDistStatus(id, false)
      }
      return success
    })

    // 在浏览器中打开
    ipcMain.handle('open-in-browser', (_, url: string) => {
      shell.openExternal(url)
    })
  }

  // 当应用程序退出时清理资源
  public async cleanup() {
    await this.serverManager.stopAllServers()
  }
}
