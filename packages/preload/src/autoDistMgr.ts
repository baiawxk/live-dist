import { ipcRenderer } from 'electron'

// 自动创建 IPC 调用方法
const createIPCMethod = (methodName: string) => {
  return async (...args: any[]) => {
    return await ipcRenderer.invoke(methodName, ...args)
  }
}

// Dist管理相关IPC客户端
export const distMgr = {
  // 获取所有目录配置
  getAllDists: createIPCMethod('dist:getAllDists'),
  
  // 添加新的目录配置
  addDist: createIPCMethod('dist:addDist'),
  
  // 更新目录配置
  updateDist: createIPCMethod('dist:updateDist'),
  
  // 删除目录配置
  removeDist: createIPCMethod('dist:removeDist'),
  
  // 选择目录
  selectDirectory: createIPCMethod('dist:selectDirectory'),
}

// 服务器管理相关IPC客户端
export const serverMgr = {
  // 启动服务器
  startServer: createIPCMethod('server:startServer'),
  
  // 停止服务器
  stopServer: createIPCMethod('server:stopServer'),
}

// Shell相关IPC客户端
export const shell = {
  // 在浏览器中打开
  openInBrowser: (url: string) => {
    ipcRenderer.invoke('shell:openInBrowser', url)
  },
}

// 为了保持向后兼容性，也导出单独的方法
export const getAllDists = distMgr.getAllDists
export const addDist = distMgr.addDist
export const updateDist = distMgr.updateDist
export const removeDist = distMgr.removeDist
export const selectDirectory = distMgr.selectDirectory
export const startServer = serverMgr.startServer
export const stopServer = serverMgr.stopServer
export const openInBrowser = shell.openInBrowser