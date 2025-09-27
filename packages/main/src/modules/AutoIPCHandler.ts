import { distApi, serverApi, shellApi } from '@app/api'
import { dialog, ipcMain, shell } from 'electron'
import { DistManager } from './DistManager.js'
import { LiveServerManager } from './LiveServerManager.js'

const distManager = new DistManager()
const serverManager = new LiveServerManager()

const setupDistMgr = distApi.createIpcSetupFn({
  getAllDists: async () => {
    return await distManager.getAllDists()
  },
  addDist: async (config) => {
    try {
      const result = await distManager.addDist(config)
      console.log('addDist result in main:', result)
      return result
    }
    catch (error) {
      console.error('addDist error in main:', error)
      throw error
    }
  },
  updateDist: async (config) => {
    return await distManager.updateDist(config.id, config)
  },
  removeDist: async (id) => {
    return await distManager.removeDist(id)
  },
  selectDirectory: async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    })
    return result.canceled || !result.filePaths[0] ? null : result.filePaths[0]
  },
})

const setupServer = serverApi.createIpcSetupFn({
  startServer: async (id) => {
    console.log('Attempting to start server for ID:', id)

    const dist = await distManager.getDist(id)
    if (!dist) {
      console.log('No dist config found for ID:', id)
      return false
    }

    console.log('Starting server with dist config:', dist)
    const success = await serverManager.startServer(dist)
    if (success) {
      console.log('Server started successfully, updating status')
      await distManager.updateDistStatus(id, true)
    }
    else {
      console.log('Server failed to start')
    }
    return success
  },
  stopServer: async (id) => {
    console.log('Attempting to stop server for ID:', id)

    const isRunning = serverManager.getServerStatus(id)
    if (!isRunning) {
      console.log('Server was not running, updating status only')
      await distManager.updateDistStatus(id, false)
      return true
    }

    console.log('Server is running, attempting to stop')
    const success = await serverManager.stopServer(id)
    if (success) {
      console.log('Server stopped successfully, updating status')
      await distManager.updateDistStatus(id, false)
    }
    else {
      console.log('Failed to stop server')
    }
    return success
  },
})

const setupShell = shellApi.createIpcSetupFn({
  openInBrowser: async (url) => {
    await shell.openExternal(url)
  },
})

// 设置 IPC 处理器
export function setupAutoIPCHandler() {
  setupDistMgr(ipcMain)
  setupServer(ipcMain)
  setupShell(ipcMain)
}

// 当应用程序退出时清理资源
export async function cleanupAutoIPC() {
  await serverManager.stopAllServers()
}
