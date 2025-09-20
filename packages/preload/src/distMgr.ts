import { ipcRenderer } from 'electron'

interface ProxyRule {
  path: string
  target: string
  changeOrigin?: boolean
  secure?: boolean
}

interface DistConfig {
  id: string
  name: string
  path: string
  port: number
  isActive: boolean
  proxyRules: ProxyRule[]
}

export default{
  // 获取所有目录配置
  getAllDists: async () => {
    return await ipcRenderer.invoke('get-all-dists')
  },
  // 添加新的目录配置
  addDist: async (config: Omit<DistConfig, 'id' | 'isActive'>) => {
    try {
      const result = await ipcRenderer.invoke('add-dist', config)
      console.log('addDist result:', result)
      return result
    } catch (error) {
      console.error('addDist error:', error)
      throw error
    }
  },
  // 更新目录配置
  updateDist: async (config: DistConfig) => {
    return await ipcRenderer.invoke('update-dist', config)
  },
  // 删除目录配置
  removeDist: async (id: string) => {
    return await ipcRenderer.invoke('remove-dist', id)
  },
  // 选择目录
  selectDirectory: async () => {
    return await ipcRenderer.invoke('select-directory')
  },
  // 启动服务器
  startServer: async (id: string) => {
    return await ipcRenderer.invoke('start-server', id)
  },
  // 停止服务器
  stopServer: async (id: string) => {
    return await ipcRenderer.invoke('stop-server', id)
  },
  // 在浏览器中打开
  openInBrowser: (url: string) => {
    ipcRenderer.invoke('open-in-browser', url)
  },
}
