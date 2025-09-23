import { LiveServerManager } from '../modules/LiveServerManager.js'
import { getDist, updateDistStatus } from './distMgr.js'

// 创建服务器管理器实例
const serverManager = new LiveServerManager()

// 启动服务器
export async function startServer(id: string): Promise<boolean> {
  console.log('Attempting to start server for ID:', id)
  const dist = await getDist(id)
  if (!dist) {
    console.log('No dist config found for ID:', id)
    return false
  }

  console.log('Starting server with dist config:', dist)
  const success = await serverManager.startServer(dist)
  if (success) {
    console.log('Server started successfully, updating status')
    await updateDistStatus(id, true)
  }
  else {
    console.log('Server failed to start')
  }
  return success
}

// 停止服务器
export async function stopServer(id: string): Promise<boolean> {
  console.log('Attempting to stop server for ID:', id)

  // 先检查服务器是否真的在运行
  const isRunning = serverManager.getServerStatus(id)
  if (!isRunning) {
    console.log('Server was not running, updating status only')
    await updateDistStatus(id, false)
    return true
  }

  console.log('Server is running, attempting to stop')
  const success = await serverManager.stopServer(id)
  if (success) {
    console.log('Server stopped successfully, updating status')
    await updateDistStatus(id, false)
  }
  else {
    console.log('Failed to stop server')
  }
  return success
}

// 获取服务器状态
export async function getServerStatus(id: string): Promise<boolean> {
  return serverManager.getServerStatus(id)
}
