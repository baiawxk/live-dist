import { createIPCInvoker, distApi, serverApi, shellApi } from '@app/api'
import { ipcRenderer } from 'electron'

// Dist管理相关IPC客户端
export const distMgr = createIPCInvoker(distApi, ipcRenderer)

// 服务器管理相关IPC客户端
export const serverMgr = createIPCInvoker(serverApi, ipcRenderer)

// Shell相关IPC客户端
export const shell = createIPCInvoker(shellApi, ipcRenderer)
