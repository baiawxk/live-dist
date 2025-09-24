import { z } from 'zod'

// Server 模块 API 定义
export const serverApi = {
  // 启动服务器
  startServer: {
    channel: 'server:startServer',
    input: z.promise(z.string()),
    output: z.promise(z.boolean()),
  },
  
  // 停止服务器
  stopServer: {
    channel: 'server:stopServer',
    input: z.promise(z.string()),
    output: z.promise(z.boolean()),
  },
} as const

// 导出类型推导工具
export type ServerApi = typeof serverApi
export type StartServerInput = z.infer<typeof serverApi.startServer.input>
export type StopServerInput = z.infer<typeof serverApi.stopServer.input>