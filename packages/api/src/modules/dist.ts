import { z } from 'zod'
import { createApiSchema } from '../core'

// 代理规则类型定义
export const ProxyRuleSchema = z.object({
  path: z.string(),
  target: z.string(),
  changeOrigin: z.boolean().optional().default(true),
  secure: z.boolean().optional().default(false),
})

// 目录配置类型定义
export const DistConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string(),
  port: z.number().min(1024).max(65535),
  isActive: z.boolean(),
  proxyRules: z.array(ProxyRuleSchema),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
})

// 导出 TypeScript 类型
export type ProxyRule = z.infer<typeof ProxyRuleSchema>
export type DistConfig = z.infer<typeof DistConfigSchema>

export const distApi = createApiSchema(
  {
    getAllDists: z.function({
      input: [z.void()],
      output: z.array(DistConfigSchema),
    }),

    addDist: z.function({
      input: [DistConfigSchema.omit({ id: true, isActive: true, createdAt: true, updatedAt: true })],
      output: DistConfigSchema,
    }),

    updateDist: z.function({
      input: [DistConfigSchema],
      output: DistConfigSchema,
    }),

    removeDist: z.function({
      input: [z.string()],
      output: z.boolean(),
    }),

    selectDirectory: z.function({
      input: [z.void()],
      output: z.string().nullable(),
    }),
  },
  {
    channelPrefix: 'dist',
  },
)
