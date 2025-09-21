import Store from 'electron-store'

export interface ProxyConfig {
  path: string
  target: string
  changeOrigin?: boolean
  secure?: boolean
}

export interface DistConfig {
  id: string
  name: string
  path: string
  port: number
  isActive: boolean
  proxyRules: ProxyConfig[]
  createdAt: number
  updatedAt: number
}

export class DistManager {
  private store: Store<{
    dists: DistConfig[]
  }>

  constructor() {
    this.store = new Store<{
      dists: DistConfig[]
    }>({
      name: 'dist-configs', // 配置文件名
      defaults: {
        dists: [],
      },
    })
  }

  // 获取所有 dist 配置
  getAllDists(): DistConfig[] {
    return this.store.get('dists') as DistConfig[]
  }

  // 添加新的 dist 配置
  addDist(config: Omit<DistConfig, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>): DistConfig {
    try {
      const dists = this.getAllDists()
      const newDist: DistConfig = {
        ...config,
        id: Date.now().toString(),
        isActive: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      this.store.set('dists', [...dists, newDist])
      console.log('New dist added:', newDist)
      return newDist
    }
    catch (error) {
      console.error('Error adding dist:', error)
      throw error
    }
  }

  // 更新 dist 配置
  updateDist(id: string, update: Partial<Omit<DistConfig, 'id' | 'createdAt'>>): DistConfig | null {
    const dists = this.getAllDists()
    const index = dists.findIndex(dist => dist.id === id)

    if (index === -1)
      return null

    const updatedDist: DistConfig = {
      ...dists[index],
      ...update,
      updatedAt: Date.now(),
    }

    dists[index] = updatedDist
    this.store.set('dists', dists)
    return updatedDist
  }

  // 删除 dist 配置
  removeDist(id: string): boolean {
    const dists = this.getAllDists()
    const filteredDists = dists.filter(dist => dist.id !== id)

    if (filteredDists.length === dists.length) {
      return false
    }

    this.store.set('dists', filteredDists)
    return true
  }

  // 获取单个 dist 配置
  getDist(id: string): DistConfig | null {
    const dists = this.getAllDists()
    return dists.find(dist => dist.id === id) || null
  }

  // 更新 dist 的活动状态
  updateDistStatus(id: string, isActive: boolean): boolean {
    console.log(`Updating status for ID ${id} to ${isActive}`)
    try {
      const dists = this.getAllDists()
      const index = dists.findIndex(dist => dist.id === id)

      if (index === -1) {
        console.log(`No dist found with ID ${id}`)
        return false
      }

      const updatedDist = {
        ...dists[index],
        isActive,
        updatedAt: Date.now(),
      }

      dists[index] = updatedDist
      this.store.set('dists', dists)
      console.log(`Status updated successfully for ${id}`)
      return true
    }
    catch (error) {
      console.error(`Error updating status for ${id}:`, error)
      return false
    }
  }
}
