import type { ElectronAPI } from '../types/ipc.js'
// 从生成的客户端文件导入所有IPC客户端函数
import { electronAPI } from './generated/ipc-client.js'

const { app, distMgr, server } = electronAPI as ElectronAPI
// 导出electronAPI供直接使用
export { app, distMgr, server }
