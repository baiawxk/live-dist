import { promises as fs } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import plugin from '../src/index'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 使用项目中实际的 IPC 文件进行测试
const projectIpcDir = resolve(__dirname, '../../main/src/ipc')

describe('iPC Plugin - Real Project Files', () => {
  it('should scan real project IPC functions correctly', async () => {
    const ipcPlugin = plugin({
      scanDir: projectIpcDir,
      typeDefinitionFile: resolve(__dirname, 'project-types.d.ts'),
    })

    // 模拟配置解析
    await ipcPlugin.configResolved({ mode: 'development' })

    // 检查虚拟模块 ID 解析
    const resolvedMainId = ipcPlugin.resolveId('virtual:ipc-main')
    const resolvedPreloadId = ipcPlugin.resolveId('virtual:ipc-preload')

    expect(resolvedMainId).toBe('\0virtual:ipc-main')
    expect(resolvedPreloadId).toBe('\0virtual:ipc-preload')
  })

  it('should generate main registration code for real project', async () => {
    const ipcPlugin = plugin({
      scanDir: projectIpcDir,
      typeDefinitionFile: resolve(__dirname, 'project-types.d.ts'),
    })

    // 模拟配置解析
    await ipcPlugin.configResolved({ mode: 'development' })

    // 生成主进程代码
    const mainCode = await ipcPlugin.load('\0virtual:ipc-main')

    // 验证生成的代码包含项目中的实际函数
    expect(mainCode).toMatchSnapshot()
  })

  it('should generate preload client code for real project', async () => {
    const ipcPlugin = plugin({
      scanDir: projectIpcDir,
      typeDefinitionFile: resolve(__dirname, 'project-types.d.ts'),
    })

    // 模拟配置解析
    await ipcPlugin.configResolved({ mode: 'development' })

    // 生成 preload 代码
    const preloadCode = await ipcPlugin.load('\0virtual:ipc-preload')

    // 验证生成的代码包含正确的对象结构
    expect(preloadCode).toMatchSnapshot()
  })

  it('should generate type definitions for real project', async () => {
    const typeDefFile = resolve(__dirname, 'project-types.d.ts')
    const ipcPlugin = plugin({
      scanDir: projectIpcDir,
      typeDefinitionFile: typeDefFile,
    })

    // 模拟配置解析
    await ipcPlugin.configResolved({ mode: 'development' })

    // 生成 preload 代码（这会触发类型定义的生成）
    await ipcPlugin.load('\0virtual:ipc-preload')

    // 检查类型定义文件是否创建
    try {
      const typeDefs = await fs.readFile(typeDefFile, 'utf-8')
      expect(typeDefs).toContain('export const app: {')
      expect(typeDefs).toContain('export const distMgr: {')
      expect(typeDefs).toContain('export const server: {')

      // 验证类型定义包含项目中的实际函数
      expect(typeDefs).toContain('openInBrowser: typeof import(')
      expect(typeDefs).toContain('getAllDists: typeof import(')
      expect(typeDefs).toContain('startServer: typeof import(')
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
