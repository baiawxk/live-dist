import type { z } from 'zod'

// 通用 IPC 客户端创建函数
export function createIpcClient() {
  return <InputSchema extends z.ZodTypeAny, OutputSchema extends z.ZodTypeAny>(
    channel: string,
    inputSchema: InputSchema,
    outputSchema: OutputSchema,
  ) => {
    return async (args?: z.infer<InputSchema>): Promise<z.infer<OutputSchema>> => {
      // 在实际使用中，这里会通过 window.electron.ipcRenderer 调用
      // 由于这是在 API 层，我们只定义接口，不实现具体调用
      throw new Error(`IPC client not implemented for channel: ${channel}`)
    }
  }
}

// 模块化客户端创建
export function createModuleClient<ApiDef extends Record<string, any>>(apiDef: ApiDef) {
  const createClient = createIpcClient()

  const client = {} as {
    [K in keyof ApiDef]: (args?: z.infer<ApiDef[K]['input']>) => Promise<z.infer<ApiDef[K]['output']>>
  }

  for (const [methodName, methodDef] of Object.entries(apiDef)) {
    // @ts-ignore
    client[methodName] = createClient(
      methodDef.channel,
      methodDef.input,
      methodDef.output,
    )
  }

  return client
}

// 客户端实现工厂函数 - 供 preload 层使用
export function createIpcClientImplementation() {
  return <InputSchema extends z.ZodTypeAny, OutputSchema extends z.ZodTypeAny>(
    channel: string,
    inputSchema: InputSchema,
    outputSchema: OutputSchema,
    ipcRenderer: any, // Electron 的 ipcRenderer
  ) => {
    return async (args?: z.infer<InputSchema>): Promise<z.infer<OutputSchema>> => {
      try {
        // 参数验证
        const parsedArgs = args !== undefined ? await inputSchema.parseAsync(args) : await inputSchema.parseAsync(undefined)

        // IPC 调用
        const result = await ipcRenderer.invoke(channel, parsedArgs)

        // 返回值验证
        return await outputSchema.parseAsync(result)
      }
      catch (error) {
        console.error(`Error in IPC client ${channel}:`, error)
        throw error
      }
    }
  }
}

// 模块化客户端实现 - 供 preload 层使用
export function createModuleClientImplementation<ApiDef extends Record<string, any>>(
  apiDef: ApiDef,
  ipcRenderer: any,
) {
  const createClientImpl = createIpcClientImplementation()

  const client = {} as {
    [K in keyof ApiDef]: (args?: z.infer<ApiDef[K]['input']>) => Promise<z.infer<ApiDef[K]['output']>>
  }

  for (const [methodName, methodDef] of Object.entries(apiDef)) {
    // @ts-ignore
    client[methodName] = createClientImpl(
      methodDef.channel,
      methodDef.input,
      methodDef.output,
      ipcRenderer,
    )
  }

  return client
}
