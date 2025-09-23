import { promises as fs } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import plugin from '../src/index'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 创建临时 IPC 函数目录用于测试
const tempIpcDir = resolve(__dirname, 'temp-ipc')
const tempMainRegistryFile = resolve(__dirname, 'temp-ipc-registry.ts')
const tempPreloadClientFile = resolve(__dirname, 'temp-ipc-client.ts')
const tempTypeDefFile = resolve(__dirname, 'temp-types.d.ts')

describe('iPC Plugin', () => {
  beforeEach(async () => {
    // 创建临时目录和测试文件
    await fs.mkdir(tempIpcDir, { recursive: true })

    // 创建测试 IPC 文件 (使用驼峰命名避免连字符问题)
    await fs.writeFile(
      resolve(tempIpcDir, 'testApi.ts'),
      `
export async function testFunction(param: string): Promise<string> {
  return 'result: ' + param
}

export function syncFunction(value: number): number {
  return value * 2
}
      `,
    )
  })

  afterEach(async () => {
    // 清理临时目录和文件
    try {
      await fs.rm(tempIpcDir, { recursive: true, force: true })
      await fs.rm(tempMainRegistryFile, { force: true })
      await fs.rm(tempPreloadClientFile, { force: true })
      await fs.rm(tempTypeDefFile, { force: true })
    }
    catch (error) {
      // 忽略删除错误
    }
  })

  it('should scan IPC functions correctly', async () => {
    const ipcPlugin = plugin({
      scanDir: tempIpcDir,
      mainRegistryFile: tempMainRegistryFile,
      preloadClientFile: tempPreloadClientFile,
      typeDefinitionFile: tempTypeDefFile,
    })

    // 模拟配置解析
    await ipcPlugin.configResolved({ mode: 'development' })
    
    // 模拟构建开始
    await ipcPlugin.buildStart()

    // 检查生成的文件是否存在
    const mainRegistryExists = await fs.access(tempMainRegistryFile).then(() => true).catch(() => false)
    const preloadClientExists = await fs.access(tempPreloadClientFile).then(() => true).catch(() => false)
    const typeDefExists = await fs.access(tempTypeDefFile).then(() => true).catch(() => false)

    expect(mainRegistryExists).toBe(true)
    expect(preloadClientExists).toBe(true)
    expect(typeDefExists).toBe(true)
  })

  it('should generate main registration code correctly', async () => {
    const ipcPlugin = plugin({
      scanDir: tempIpcDir,
      mainRegistryFile: tempMainRegistryFile,
      preloadClientFile: tempPreloadClientFile,
      typeDefinitionFile: tempTypeDefFile,
    })

    // 模拟配置解析
    await ipcPlugin.configResolved({ mode: 'development' })
    
    // 模拟构建开始
    await ipcPlugin.buildStart()

    // 检查生成的主进程注册代码
    const mainCode = await fs.readFile(tempMainRegistryFile, 'utf-8')
    expect(mainCode).toContain('import { testFunction, syncFunction } from')
    expect(mainCode).toContain('ipcMain.handle(\'testApi:testFunction\'')
    expect(mainCode).toContain('ipcMain.handle(\'testApi:syncFunction\'')
    expect(mainCode).toContain('export function registerIPCFunctions()')
  })

  it('should generate preload client code correctly', async () => {
    const ipcPlugin = plugin({
      scanDir: tempIpcDir,
      mainRegistryFile: tempMainRegistryFile,
      preloadClientFile: tempPreloadClientFile,
      typeDefinitionFile: tempTypeDefFile,
    })

    // 模拟配置解析
    await ipcPlugin.configResolved({ mode: 'development' })
    
    // 模拟构建开始
    await ipcPlugin.buildStart()

    // 检查生成的preload客户端代码
    const preloadCode = await fs.readFile(tempPreloadClientFile, 'utf-8')
    expect(preloadCode).toContain('import { ipcRenderer } from \'electron\'')
    expect(preloadCode).toContain('export const testApi = {')
    expect(preloadCode).toContain('testFunction: (...args) => ipcRenderer.invoke(\'testApi:testFunction\'')
    expect(preloadCode).toContain('syncFunction: (...args) => ipcRenderer.invoke(\'testApi:syncFunction\'')
  })

  it('should generate type definitions correctly', async () => {
    const ipcPlugin = plugin({
      scanDir: tempIpcDir,
      mainRegistryFile: tempMainRegistryFile,
      preloadClientFile: tempPreloadClientFile,
      typeDefinitionFile: tempTypeDefFile,
    })

    // 模拟配置解析
    await ipcPlugin.configResolved({ mode: 'development' })
    
    // 模拟构建开始
    await ipcPlugin.buildStart()

    // 检查生成的类型定义文件
    const typeDefs = await fs.readFile(tempTypeDefFile, 'utf-8')
    expect(typeDefs).toContain('export const testApi: {')
    expect(typeDefs).toContain('testFunction: typeof import(')
    expect(typeDefs).toContain('syncFunction: typeof import(')
  })
})
