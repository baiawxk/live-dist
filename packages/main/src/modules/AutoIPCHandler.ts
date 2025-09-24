import { createModuleHandlerImplementation, distApi, serverApi, shellApi } from '@app/api'
import { dialog, ipcMain, shell } from 'electron'
import { DistManager } from './DistManager.js'
import { LiveServerManager } from './LiveServerManager.js'

// 实现业务逻辑
const distImplementations = {
  getAllDists: async () => {
    const distManager = new DistManager()
    return distManager.getAllDists()
  },
  addDist: async (config: any) => {
    const distManager = new DistManager()
    try {
      const result = distManager.addDist(config)
      console.log('addDist result in main:', result)
      return result
    }
    catch (error) {
      console.error('addDist error in main:', error)
      throw error
    }
  },
  updateDist: async (config: any) => {
    const distManager = new DistManager()
    return distManager.updateDist(config.id, config)
  },
  removeDist: async (id: string) => {
    const distManager = new DistManager()
    return distManager.removeDist(id)
  },
  selectDirectory: async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    })
    return result.canceled ? null : result.filePaths[0]
  },
}

const serverImplementations = {
  startServer: async (id: string) => {
    console.log('Attempting to start server for ID:', id)
    const distManager = new DistManager()
    const serverManager = new LiveServerManager()

    const dist = distManager.getDist(id)
    if (!dist) {
      console.log('No dist config found for ID:', id)
      return false
    }

    console.log('Starting server with dist config:', dist)
    const success = await serverManager.startServer(dist)
    if (success) {
      console.log('Server started successfully, updating status')
      distManager.updateDistStatus(id, true)
    }
    else {
      console.log('Server failed to start')
    }
    return success
  },
  stopServer: async (id: string) => {
    console.log('Attempting to stop server for ID:', id)
    const distManager = new DistManager()
    const serverManager = new LiveServerManager()

    const isRunning = serverManager.getServerStatus(id)
    if (!isRunning) {
      console.log('Server was not running, updating status only')
      distManager.updateDistStatus(id, false)
      return true
    }

    console.log('Server is running, attempting to stop')
    const success = await serverManager.stopServer(id)
    if (success) {
      console.log('Server stopped successfully, updating status')
      distManager.updateDistStatus(id, false)
    }
    else {
      console.log('Failed to stop server')
    }
    return success
  },
}

const shellImplementations = {
  openInBrowser: async (url: string) => {
    shell.openExternal(url)
  },
}

// 设置 IPC 处理器
export function setupAutoIPCHandler() {
  createModuleHandlerImplementation(distApi, distImplementations, ipcMain)
  createModuleHandlerImplementation(serverApi, serverImplementations, ipcMain)
  createModuleHandlerImplementation(shellApi, shellImplementations, ipcMain)
}

// 当应用程序退出时清理资源
export async function cleanupAutoIPC() {
  const serverManager = new LiveServerManager()
  await serverManager.stopAllServers()
}
