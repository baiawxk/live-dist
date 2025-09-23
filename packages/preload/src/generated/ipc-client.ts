
import { ipcRenderer, contextBridge } from 'electron'

// 按文件名分组的API对象
export const electronAPI = {
  app: {
    openInBrowser: (...args: any[]) => ipcRenderer.invoke('app:openInBrowser', ...args),
    selectAppDirectory: (...args: any[]) => ipcRenderer.invoke('app:selectAppDirectory', ...args)
  },
  distMgr: {
    getAllDists: (...args: any[]) => ipcRenderer.invoke('distMgr:getAllDists', ...args),
    addDist: (...args: any[]) => ipcRenderer.invoke('distMgr:addDist', ...args),
    updateDist: (...args: any[]) => ipcRenderer.invoke('distMgr:updateDist', ...args),
    removeDist: (...args: any[]) => ipcRenderer.invoke('distMgr:removeDist', ...args),
    getDist: (...args: any[]) => ipcRenderer.invoke('distMgr:getDist', ...args),
    updateDistStatus: (...args: any[]) => ipcRenderer.invoke('distMgr:updateDistStatus', ...args),
    selectDistDirectory: (...args: any[]) => ipcRenderer.invoke('distMgr:selectDistDirectory', ...args)
  },
  server: {
    startServer: (...args: any[]) => ipcRenderer.invoke('server:startServer', ...args),
    stopServer: (...args: any[]) => ipcRenderer.invoke('server:stopServer', ...args),
    getServerStatus: (...args: any[]) => ipcRenderer.invoke('server:getServerStatus', ...args)
  }
};

export function exposeIPCFunctions() {
  contextBridge.exposeInMainWorld('ElectronAPI', electronAPI);
}
