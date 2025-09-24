import { ipcMain } from 'electron'
import { DistManager } from './DistManager.js'
import { LiveServerManager } from './LiveServerManager.js'
import { dialog, shell } from 'electron'

// Dist管理相关IPC方法
const distMethods = {
  // 获取所有目录配置
  getAllDists: () => {
    const distManager = new DistManager()
    return distManager.getAllDists()
  },

  // 添加新的目录配置
  addDist: (config: any) => {
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

  // 更新目录配置
  updateDist: (config: any) => {
    const distManager = new DistManager()
    return distManager.updateDist(config.id, config)
  },

  // 删除目录配置
  removeDist: (id: string) => {
    const distManager = new DistManager()
    return distManager.removeDist(id)
  },

  // 选择目录
  selectDirectory: async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    })
    return result.canceled ? null : result.filePaths[0]
  },
}

// 服务器管理相关IPC方法
const serverMethods = {
  // 启动服务器
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

  // 停止服务器
  stopServer: async (id: string) => {
    console.log('Attempting to stop server for ID:', id)
    const distManager = new DistManager()
    const serverManager = new LiveServerManager()

    // 先检查服务器是否真的在运行
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

// Shell相关IPC方法
const shellMethods = {
  // 在浏览器中打开
  openInBrowser: (url: string) => {
    shell.openExternal(url)
  },
}

// 按模块分组的所有IPC方法
const ipcMethodGroups = {
  dist: distMethods,
  server: serverMethods,
  shell: shellMethods,
}

// 自动注册所有 IPC 处理方法
export function setupAutoIPCHandler() {
  Object.keys(ipcMethodGroups).forEach(groupName => {
    const group = ipcMethodGroups[groupName]
    Object.keys(group).forEach(methodName => {
      const fullMethodName = `${groupName}:${methodName}`
      ipcMain.handle(fullMethodName, async (_, ...args) => {
        try {
          // @ts-ignore
          return await group[methodName](...args)
        }
        catch (error) {
          console.error(`Error in IPC method ${fullMethodName}:`, error)
          throw error
        }
      })
    })
  })
}

// 当应用程序退出时清理资源
export async function cleanupAutoIPC() {
  const serverManager = new LiveServerManager()
  await serverManager.stopAllServers()
}