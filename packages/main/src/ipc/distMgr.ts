import { dialog } from 'electron'
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

const store = new Store<{ dists: DistConfig[] }>({
  name: 'dist-configs',
  defaults: { dists: [] },
})

// 获取所有 dist 配置
export async function getAllDists(): Promise<DistConfig[]> {
  return store.get('dists') as DistConfig[]
}

// 添加新的 dist 配置
export async function addDist(config: Omit<DistConfig, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>): Promise<DistConfig> {
  try {
    const dists = store.get('dists') as DistConfig[]
    const newDist: DistConfig = {
      ...config,
      id: Date.now().toString(),
      isActive: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    store.set('dists', [...dists, newDist])
    console.log('New dist added:', newDist)
    return newDist
  }
  catch (error) {
    console.error('Error adding dist:', error)
    throw error
  }
}

// 更新 dist 配置
export async function updateDist(id: string, update: Partial<Omit<DistConfig, 'id' | 'createdAt'>>): Promise<DistConfig | null> {
  const dists = store.get('dists') as DistConfig[]
  const index = dists.findIndex(dist => dist.id === id)

  if (index === -1)
    return null

  const updatedDist: DistConfig = {
    ...dists[index],
    ...update,
    updatedAt: Date.now(),
  }

  dists[index] = updatedDist
  store.set('dists', dists)
  return updatedDist
}

// 删除 dist 配置
export async function removeDist(id: string): Promise<boolean> {
  const dists = store.get('dists') as DistConfig[]
  const filteredDists = dists.filter(dist => dist.id !== id)

  if (filteredDists.length === dists.length) {
    return false
  }

  store.set('dists', filteredDists)
  return true
}

// 获取单个 dist 配置
export async function getDist(id: string): Promise<DistConfig | null> {
  const dists = store.get('dists') as DistConfig[]
  return dists.find(dist => dist.id === id) || null
}

// 更新 dist 的活动状态
export async function updateDistStatus(id: string, isActive: boolean): Promise<boolean> {
  console.log(`Updating status for ID ${id} to ${isActive}`)
  try {
    const dists = store.get('dists') as DistConfig[]
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
    store.set('dists', dists)
    console.log(`Status updated successfully for ${id}`)
    return true
  }
  catch (error) {
    console.error(`Error updating status for ${id}:`, error)
    return false
  }
}

// 选择目录
export async function selectDistDirectory(): Promise<string | null> {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  })
  return result.canceled ? null : result.filePaths[0]
}
