declare module 'live-server' {
  interface LiveServerParams {
    port?: number
    host?: string
    root?: string
    open?: boolean
    ignore?: string | string[]
    file?: string
    wait?: number
    mount?: [string, string][]
    logLevel?: 0 | 1 | 2
    middleware?: any[]
  }

  export function start(params?: LiveServerParams): any
}

declare module 'http-proxy-middleware' {
  interface ProxyOptions {
    target: string
    changeOrigin?: boolean
    secure?: boolean
    pathRewrite?: { [key: string]: string }
    logLevel?: 'debug' | 'info' | 'warn' | 'error' | 'silent'
    router?: { [key: string]: string }
  }

  export function createProxyMiddleware(path: string | string[], options: ProxyOptions): any
}
