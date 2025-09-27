export interface ProxyRule {
  path: string
  target: string
  changeOrigin?: boolean
  secure?: boolean
}

export interface DistConfig {
  id: string
  name: string
  path: string
  port: number
  isActive: boolean
  proxyRules: ProxyRule[]
}
