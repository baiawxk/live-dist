import { distApi, serverApi, shellApi } from '@app/api'
import { ipcRenderer } from 'electron'

// Dist管理相关IPC客户端
export const distMgr = distApi.createIPCClient(ipcRenderer)

// 服务器管理相关IPC客户端
export const serverMgr = serverApi.createIPCClient(ipcRenderer)

// Shell相关IPC客户端
export const shell = shellApi.createIPCClient(ipcRenderer)
