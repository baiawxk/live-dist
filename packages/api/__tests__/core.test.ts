import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { createApiSchema } from '../src/core'

// 创建简单的测试 schema
const testSchemas = {
  // 简单的加法函数
  add: z.function({
    input: [z.number(), z.number()],
    output: z.number(),
  }),

  // 带字符串参数的函数
  greet: z.function({
    input: [z.string()],
    output: z.string(),
  }),

  // 无参数函数
  getCurrentTime: z.function({
    input: [],
    output: z.number(),
  }),

  // 复杂对象参数函数
  createUser: z.function({
    input: [z.object({
      name: z.string(),
      age: z.number(),
      email: z.string().email(),
    })],
    output: z.object({
      id: z.string(),
      name: z.string(),
      age: z.number(),
      email: z.string(),
    }),
  }),
}

// 创建 API schema
const testApi = createApiSchema(testSchemas, { channelPrefix: 'test' })

// Mock 对象
let mockIpcMain: any
let mockIpcRenderer: any

describe('core.ts - API Schema Tests', () => {
  beforeEach(() => {
    // 重置 mock 对象
    mockIpcMain = {
      handle: vi.fn(),
    }

    mockIpcRenderer = {
      invoke: vi.fn(),
    }
  })

  it('should create API schema with correct structure', () => {
    expect(testApi).toHaveProperty('schemas')
    expect(testApi).toHaveProperty('createIpcSetupFn')
    expect(testApi).toHaveProperty('createIPCClient')

    // 验证 schemas 是否正确传递
    expect(testApi.schemas).toBe(testSchemas)
  })

  it('should create IPC setup function correctly', () => {
    const implementations = {
      add: vi.fn().mockImplementation((a, b) => a + b),
      greet: vi.fn().mockImplementation(name => `Hello, ${name}!`),
      getCurrentTime: vi.fn().mockImplementation(() => Date.now()),
      createUser: vi.fn().mockImplementation(user => ({ ...user, id: '123' })),
    }

    const setupFn = testApi.createIpcSetupFn(implementations)
    setupFn(mockIpcMain)

    // 验证 ipcMain.handle 被正确调用
    expect(mockIpcMain.handle).toHaveBeenCalledTimes(4)
    expect(mockIpcMain.handle).toHaveBeenCalledWith('test:add', expect.any(Function))
    expect(mockIpcMain.handle).toHaveBeenCalledWith('test:greet', expect.any(Function))
    expect(mockIpcMain.handle).toHaveBeenCalledWith('test:getCurrentTime', expect.any(Function))
    expect(mockIpcMain.handle).toHaveBeenCalledWith('test:createUser', expect.any(Function))
  })

  it('should warn when implementation is missing', () => {
    const implementations = {
      add: vi.fn().mockImplementation((a, b) => a + b),
      // 缺少其他实现
    }

    const setupFn = testApi.createIpcSetupFn(implementations as any)
    setupFn(mockIpcMain)

    // 验证只注册了一个处理函数
    expect(mockIpcMain.handle).toHaveBeenCalledTimes(1)
    expect(mockIpcMain.handle).toHaveBeenCalledWith('test:add', expect.any(Function))
  })

  it('should create IPC client correctly', () => {
    const client = testApi.createIPCClient(mockIpcRenderer)

    // 验证客户端方法被正确创建
    expect(client).toHaveProperty('add')
    expect(client).toHaveProperty('greet')
    expect(client).toHaveProperty('getCurrentTime')
    expect(client).toHaveProperty('createUser')

    // 验证所有方法都是函数
    expect(typeof client.add).toBe('function')
    expect(typeof client.greet).toBe('function')
    expect(typeof client.getCurrentTime).toBe('function')
    expect(typeof client.createUser).toBe('function')
  })

  it('should handle IPC main function calls correctly', async () => {
    const implementations = {
      add: vi.fn().mockImplementation((a, b) => a + b),
      greet: vi.fn().mockImplementation(name => `Hello, ${name}!`),
    }

    const setupFn = testApi.createIpcSetupFn(implementations as any)
    setupFn(mockIpcMain)

    // 获取注册的处理函数
    const handleCalls = mockIpcMain.handle.mock.calls
    const addHandler = handleCalls[0][1] // 第一个参数是 channel name，第二个是处理函数

    // 测试处理函数能正确调用实现
    const result = await addHandler({}, 2, 3)
    expect(implementations.add).toHaveBeenCalledWith(2, 3)
    expect(result).toBe(5)
  })

  it('should handle IPC client calls correctly', async () => {
    const client = testApi.createIPCClient(mockIpcRenderer)
    mockIpcRenderer.invoke.mockResolvedValue(4)

    // 测试客户端调用
    const result = await client.add(2, 3)

    // 验证 invoke 被正确调用
    expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('test:add', 2, 3)
    expect(result).toBe(4)
  })

  it('should handle errors in IPC main functions', async () => {
    const error = new Error('Test error')
    const implementations = {
      add: vi.fn().mockImplementation(() => {
        throw error
      }),
    }

    const setupFn = testApi.createIpcSetupFn(implementations as any)
    setupFn(mockIpcMain)

    // 获取注册的处理函数
    const handleCalls = mockIpcMain.handle.mock.calls
    const addHandler = handleCalls[0][1]

    // 测试错误处理
    await expect(addHandler({}, 2, 3)).rejects.toThrow('Test error')
  })

  it('should handle errors in IPC client calls', async () => {
    const client = testApi.createIPCClient(mockIpcRenderer)
    const error = new Error('Test error')
    mockIpcRenderer.invoke.mockRejectedValue(error)

    // 测试错误处理
    await expect(client.add(2, 3)).rejects.toThrow('Test error')
  })

  // 类型校验测试
  it('should validate input types in IPC main functions', async () => {
    // 创建一个需要特定类型输入的 schema
    const validationSchemas = {
      addNumbers: z.function({
        input: [z.number(), z.number()],
        output: z.number(),
      }),
    }

    const validationApi = createApiSchema(validationSchemas, { channelPrefix: 'validation' })

    const implementations = {
      addNumbers: vi.fn().mockImplementation((a, b) => a + b),
    }

    const setupFn = validationApi.createIpcSetupFn(implementations)
    setupFn(mockIpcMain)

    // 获取注册的处理函数
    const handleCalls = mockIpcMain.handle.mock.calls
    const addHandler = handleCalls[0][1]

    // 测试正确的输入类型
    const result = await addHandler({}, 2, 3)
    expect(result).toBe(5)

    // 测试错误的输入类型 - 应该抛出 Zod 错误
    await expect(addHandler({}, 'invalid', 3)).rejects.toThrow()
    await expect(addHandler({}, undefined, 3)).rejects.toThrow()
    await expect(addHandler({}, null, 3)).rejects.toThrow()
  })

  it('should validate input types in IPC client calls', async () => {
    // 创建一个需要特定类型输入的 schema
    const validationSchemas = {
      processUser: z.function({
        input: [z.object({
          name: z.string(),
          age: z.number(),
        })],
        output: z.string(),
      }),
    }

    const validationApi = createApiSchema(validationSchemas, { channelPrefix: 'validation' })
    const client = validationApi.createIPCClient(mockIpcRenderer)
    mockIpcRenderer.invoke.mockResolvedValue('success')

    // 测试正确的输入类型
    const result = await client.processUser({ name: 'John', age: 30 })
    expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('validation:processUser', { name: 'John', age: 30 })
    expect(result).toBe('success')

    // 测试错误的输入类型 - 客户端应该抛出 Zod 错误
    await expect(client.processUser({ name: 123, age: 'invalid' } as any)).rejects.toThrow()
    await expect(client.processUser({ name: undefined, age: null } as any)).rejects.toThrow()
  })
})
