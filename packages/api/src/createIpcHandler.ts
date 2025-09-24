import type { z } from 'zod'

// 通用 IPC 处理器创建函数
export function createIpcHandler() {
  return <InputSchema extends z.ZodTypeAny, OutputSchema extends z.ZodTypeAny>(
    channel: string,
    inputSchema: InputSchema,
    outputSchema: OutputSchema,
    implementation: (args?: z.infer<InputSchema>) => Promise<z.infer<OutputSchema>>,
  ) => {
    // 在实际使用中，这里会通过 ipcMain.handle 注册处理器
    // 由于这是在 API 层，我们只定义接口，不实现具体注册
    throw new Error(`IPC handler not implemented for channel: ${channel}`)
  }
}

// 模块化处理器创建
export function createModuleHandler<ApiDef extends Record<string, any>>(
  apiDef: ApiDef,
  implementations: {
    [K in keyof ApiDef]: (args?: z.infer<ApiDef[K]['input']>) => Promise<z.infer<ApiDef[K]['output']>>
  },
) {
  for (const [methodName, methodDef] of Object.entries(apiDef)) {
    const implementation = implementations[methodName]
    if (implementation) {
      // 这里我们不实际调用 createIpcHandler，因为这只是一个示例
      // 在实际使用中，createModuleHandlerImplementation 会处理这个
      // 使用变量以避免未使用警告
      void methodName
      void methodDef
      void implementation
    }
  }
}

// 服务端实现工厂函数 - 供 main 层使用
export function createIpcHandlerImplementation(ipcMain: any) {
  return <InputSchema extends z.ZodTypeAny, OutputSchema extends z.ZodTypeAny>(
    channel: string,
    inputSchema: InputSchema,
    outputSchema: OutputSchema,
    implementation: (args?: z.infer<InputSchema>) => Promise<z.infer<OutputSchema>>,
  ) => {
    ipcMain.handle(channel, async (_: any, args?: any) => {
      try {
        // 参数验证
        const parsedArgs = args !== undefined ? await inputSchema.parseAsync(args) : await inputSchema.parseAsync(undefined)

        // 业务逻辑实现
        const result = await implementation(parsedArgs)

        // 返回值验证
        return await outputSchema.parseAsync(result)
      }
      catch (error) {
        console.error(`Error in IPC method ${channel}:`, error)
        throw error
      }
    })
  }
}

// 模块化处理器实现 - 供 main 层使用
export function createModuleHandlerImplementation<ApiDef extends Record<string, any>>(
  apiDef: ApiDef,
  implementations: {
    [K in keyof ApiDef]: (args?: z.infer<ApiDef[K]['input']>) => Promise<z.infer<ApiDef[K]['output']>>
  },
  ipcMain: any,
) {
  const createHandlerImpl = createIpcHandlerImplementation(ipcMain)

  for (const [methodName, methodDef] of Object.entries(apiDef)) {
    const implementation = implementations[methodName]
    if (implementation) {
      // @ts-ignore
      createHandlerImpl(
        methodDef.channel,
        methodDef.input,
        methodDef.output,
        implementation,
      )
    }
  }
}
