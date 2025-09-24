import { z } from 'zod'

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

// Dist 模块 API 定义
export const distApi = {
  // 获取所有目录配置
  getAllDists: {
    channel: 'dist:getAllDists',
    input: z.void(),
    output: z.promise(z.array(DistConfigSchema)),
  },

  // 添加新的目录配置
  addDist: {
    channel: 'dist:addDist',
    input: z.promise(DistConfigSchema.omit({ id: true, isActive: true, createdAt: true, updatedAt: true })),
    output: z.promise(DistConfigSchema),
  },

  // 更新目录配置
  updateDist: {
    channel: 'dist:updateDist',
    input: z.promise(DistConfigSchema),
    output: z.promise(DistConfigSchema),
  },

  // 删除目录配置
  removeDist: {
    channel: 'dist:removeDist',
    input: z.promise(z.string()),
    output: z.promise(z.boolean()),
  },

  // 选择目录
  selectDirectory: {
    channel: 'dist:selectDirectory',
    input: z.void(),
    output: z.promise(z.string().nullable()),
  },
} as const

// 导出类型推导工具
export type DistApi = typeof distApi
export type GetAllDistsInput = z.infer<typeof distApi.getAllDists.input>
export type AddDistInput = z.infer<typeof distApi.addDist.input>
export type UpdateDistInput = z.infer<typeof distApi.updateDist.input>
export type RemoveDistInput = z.infer<typeof distApi.removeDist.input>
export type SelectDirectoryInput = z.infer<typeof distApi.selectDirectory.input>
