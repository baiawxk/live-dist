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
      try {
        const result = this.distManager.addDist(config)
        console.log('addDist result in main:', result)
        return result
      } catch (error) {
        console.error('addDist error in main:', error)
        throw error
      }
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
      console.log('Attempting to start server for ID:', id);
      const dist = this.distManager.getDist(id)
      if (!dist) {
        console.log('No dist config found for ID:', id);
        return false;
      }

      console.log('Starting server with dist config:', dist);
      const success = await this.serverManager.startServer(dist)
      if (success) {
        console.log('Server started successfully, updating status');
        this.distManager.updateDistStatus(id, true)
      } else {
        console.log('Server failed to start');
      }
      return success;
    })

    // 停止服务器
    ipcMain.handle('stop-server', async (_, id: string) => {
      console.log('Attempting to stop server for ID:', id);
      
      // 先检查服务器是否真的在运行
      const isRunning = this.serverManager.getServerStatus(id);
      if (!isRunning) {
        console.log('Server was not running, updating status only');
        this.distManager.updateDistStatus(id, false);
        return true;
      }

      console.log('Server is running, attempting to stop');
      const success = await this.serverManager.stopServer(id)
      if (success) {
        console.log('Server stopped successfully, updating status');
        this.distManager.updateDistStatus(id, false)
      } else {
        console.log('Failed to stop server');
      }
      return success;
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
