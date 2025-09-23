import { promises as fs } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import plugin from '../src/index'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 创建临时 IPC 函数目录用于测试
const tempIpcDir = resolve(__dirname, 'temp-ipc')

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
    // 清理临时目录
    try {
      await fs.rm(tempIpcDir, { recursive: true, force: true })
    }
    catch (error) {
      // 忽略删除错误
    }
  })

  it('should scan IPC functions correctly', async () => {
    const ipcPlugin = plugin({
      scanDir: tempIpcDir,
      typeDefinitionFile: resolve(__dirname, 'temp-types.d.ts'),
    })

    // 模拟配置解析
    await ipcPlugin.configResolved({ mode: 'development' })

    // 检查虚拟模块 ID 解析
    const resolvedMainId = ipcPlugin.resolveId('virtual:ipc-main')
    const resolvedPreloadId = ipcPlugin.resolveId('virtual:ipc-preload')

    expect(resolvedMainId).toBe('\0virtual:ipc-main')
    expect(resolvedPreloadId).toBe('\0virtual:ipc-preload')
  })

  it('should generate main registration code correctly', async () => {
    const ipcPlugin = plugin({
      scanDir: tempIpcDir,
      typeDefinitionFile: resolve(__dirname, 'temp-types.d.ts'),
    })

    // 模拟配置解析
    await ipcPlugin.configResolved({ mode: 'development' })

    // 生成主进程代码
    const mainCode = await ipcPlugin.load('\0virtual:ipc-main')

    expect(mainCode).matchSnapshot()
  })

  it('should generate preload client code correctly', async () => {
    const ipcPlugin = plugin({
      scanDir: tempIpcDir,
      typeDefinitionFile: resolve(__dirname, 'temp-types.d.ts'),
    })

    // 模拟配置解析
    await ipcPlugin.configResolved({ mode: 'development' })

    // 生成 preload 代码
    const preloadCode = await ipcPlugin.load('\0virtual:ipc-preload')

    expect(preloadCode).matchSnapshot()
  })

  it('should generate type definitions correctly', async () => {
    const typeDefFile = resolve(__dirname, 'temp-types.d.ts')
    const ipcPlugin = plugin({
      scanDir: tempIpcDir,
      typeDefinitionFile: typeDefFile,
    })

    // 模拟配置解析
    await ipcPlugin.configResolved({ mode: 'development' })

    // 生成 preload 代码（这会触发类型定义的生成）
    await ipcPlugin.load('\0virtual:ipc-preload')

    // 检查类型定义文件是否创建
    try {
      const typeDefs = await fs.readFile(typeDefFile, 'utf-8')
      expect(typeDefs).toContain('export const testApi: {')
      expect(typeDefs).toContain('testFunction: typeof import(')
      expect(typeDefs).toContain('syncFunction: typeof import(')
    }
    finally {
      // 清理类型定义文件
      try {
        await fs.rm(typeDefFile, { force: true })
      }
      catch (error) {
        // 忽略删除错误
      }
    }
  })
})
