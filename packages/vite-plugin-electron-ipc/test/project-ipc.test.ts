import { promises as fs } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import plugin from '../src/index'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 使用项目中实际的 IPC 文件进行测试
const projectIpcDir = resolve(__dirname, '../../main/src/ipc')
const projectMainRegistryFile = resolve(__dirname, '../../main/src/generated/ipc-registry.ts')
const projectPreloadClientFile = resolve(__dirname, '../../preload/src/generated/ipc-client.ts')
const projectTypeDefFile = resolve(__dirname, '../../preload/src/generated/ipc-types.d.ts')

describe('iPC Plugin - Real Project Files', () => {
  it('should scan real project IPC functions correctly', async () => {
    const ipcPlugin = plugin({
      scanDir: projectIpcDir,
      mainRegistryFile: projectMainRegistryFile,
      preloadClientFile: projectPreloadClientFile,
      typeDefinitionFile: projectTypeDefFile,
    })

    // 模拟配置解析
    await ipcPlugin.configResolved({ mode: 'development' })
    
    // 模拟构建开始
    await ipcPlugin.buildStart()

    // 检查生成的文件是否存在
    const mainRegistryExists = await fs.access(projectMainRegistryFile).then(() => true).catch(() => false)
    const preloadClientExists = await fs.access(projectPreloadClientFile).then(() => true).catch(() => false)
    const typeDefExists = await fs.access(projectTypeDefFile).then(() => true).catch(() => false)

    expect(mainRegistryExists).toBe(true)
    expect(preloadClientExists).toBe(true)
    expect(typeDefExists).toBe(true)
  })

  it('should generate main registration code for real project', async () => {
    const ipcPlugin = plugin({
      scanDir: projectIpcDir,
      mainRegistryFile: projectMainRegistryFile,
      preloadClientFile: projectPreloadClientFile,
      typeDefinitionFile: projectTypeDefFile,
    })

    // 模拟配置解析
    await ipcPlugin.configResolved({ mode: 'development' })
    
    // 模拟构建开始
    await ipcPlugin.buildStart()

    // 检查生成的主进程注册代码
    const mainCode = await fs.readFile(projectMainRegistryFile, 'utf-8')
    expect(mainCode).toContain('import { openInBrowser, selectAppDirectory } from')
    expect(mainCode).toContain('import { getAllDists, addDist, updateDist, removeDist, getDist, updateDistStatus, selectDistDirectory } from')
    expect(mainCode).toContain('import { startServer, stopServer, getServerStatus } from')
    expect(mainCode).toContain('export function registerIPCFunctions()')
  })

  it('should generate preload client code for real project', async () => {
    const ipcPlugin = plugin({
      scanDir: projectIpcDir,
      mainRegistryFile: projectMainRegistryFile,
      preloadClientFile: projectPreloadClientFile,
      typeDefinitionFile: projectTypeDefFile,
    })

    // 模拟配置解析
    await ipcPlugin.configResolved({ mode: 'development' })
    
    // 模拟构建开始
    await ipcPlugin.buildStart()

    // 检查生成的preload客户端代码
    const preloadCode = await fs.readFile(projectPreloadClientFile, 'utf-8')
    expect(preloadCode).toContain('import { ipcRenderer } from \'electron\'')
    expect(preloadCode).toContain('export const app = {')
    expect(preloadCode).toContain('export const distMgr = {')
    expect(preloadCode).toContain('export const server = {')
  })

  it('should generate type definitions for real project', async () => {
    const ipcPlugin = plugin({
      scanDir: projectIpcDir,
      mainRegistryFile: projectMainRegistryFile,
      preloadClientFile: projectPreloadClientFile,
      typeDefinitionFile: projectTypeDefFile,
    })

    // 模拟配置解析
    await ipcPlugin.configResolved({ mode: 'development' })
    
    // 模拟构建开始
    await ipcPlugin.buildStart()

    // 检查生成的类型定义文件
    const typeDefs = await fs.readFile(projectTypeDefFile, 'utf-8')
    expect(typeDefs).toContain('export const app: {')
    expect(typeDefs).toContain('export const distMgr: {')
    expect(typeDefs).toContain('export const server: {')
    
    // 验证类型定义包含项目中的实际函数
    expect(typeDefs).toContain('openInBrowser: typeof import(')
    expect(typeDefs).toContain('getAllDists: typeof import(')
    expect(typeDefs).toContain('startServer: typeof import(')
  })
})
