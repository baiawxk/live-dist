import { createModuleClientImplementation, distApi, serverApi, shellApi } from '@app/api'
import { ipcRenderer } from 'electron'

// 创建模块化客户端实现
const createClient = createModuleClientImplementation

// Dist管理相关IPC客户端
export const distMgr = createClient(distApi, ipcRenderer)

// 服务器管理相关IPC客户端
export const serverMgr = createClient(serverApi, ipcRenderer)

// Shell相关IPC客户端
export const shell = createClient(shellApi, ipcRenderer)
