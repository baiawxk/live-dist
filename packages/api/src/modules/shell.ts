import { z } from 'zod'

// Shell 模块 API 定义
export const shellApi = {
  // 在浏览器中打开
  openInBrowser: {
    channel: 'shell:openInBrowser',
    input: z.promise(z.string()),
    output: z.promise(z.void()),
  },
} as const

// 导出类型推导工具
export type ShellApi = typeof shellApi
export type OpenInBrowserInput = z.infer<typeof shellApi.openInBrowser.input>