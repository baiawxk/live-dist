import type { DistConfig, ProxyConfig } from './DistManager.js'
import { exec } from 'node:child_process'
import net from 'node:net'
import { createProxyMiddleware } from 'http-proxy-middleware'
import liveServer from 'live-server'

interface ServerInstance {
  port: number
  distId: string
  server: any // HTTP server 实例
  wss?: any // WebSocket server 实例
  watcher?: any // 文件监听器实例
}

export class LiveServerManager {
  private servers: Map<string, ServerInstance> = new Map()

  constructor() {
    // 注册进程退出时的清理函数
    process.on('SIGINT', this.handleProcessExit.bind(this))
    process.on('SIGTERM', this.handleProcessExit.bind(this))
    process.on('exit', this.handleProcessExit.bind(this))
  }

  private async handleProcessExit() {
    console.log('Cleaning up servers before exit...')
    await this.stopAllServers()
    process.exit(0)
  }

  // 检查端口是否被占用
  private async isPortInUse(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const tester = net.createServer()
        .once('error', () => resolve(true))
        .once('listening', () => {
          tester.once('close', () => resolve(false))
            .close()
        })
        .listen(port)
    })
  }

  // 启动一个新的 live-server 实例
  async startServer(config: DistConfig): Promise<boolean> {
    if (this.servers.has(config.id)) {
      return false
    }

    try {
      // 检查端口是否已被占用
      if (await this.isPortInUse(config.port)) {
        console.log(`Port ${config.port} is already in use. Attempting to force close...`)
        // 尝试强制关闭端口
        await this.stopServer(config.id)
        // 等待端口释放
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      const serverConfig = {
        port: config.port,
        root: config.path,
        open: false, // 不自动打开浏览器
        logLevel: 2 as 0 | 1 | 2, // 0 = errors only, 1 = some, 2 = lots
        middleware: this.createProxyMiddleware(config.proxyRules),
        host: '0.0.0.0',
        https: false,
        wait: 100,
        mount: [] as Array<[string, string]>,
        proxy: [] as Array<[string, string]>,
        cors: false,
        file: 'index.html',
        watch: [] as string[],
        ignore: [] as string[],
      }

      console.log('Starting live-server with config:', JSON.stringify(serverConfig, null, 2))
      const liveServerInstance = liveServer.start(serverConfig)

      // 等待服务器实际启动
      await new Promise<void>((resolve) => {
        const checkServer = setInterval(() => {
          if (liveServerInstance && liveServerInstance._events) {
            clearInterval(checkServer)
            resolve()
          }
        }, 100)

        // 5秒超时
        setTimeout(() => {
          clearInterval(checkServer)
          resolve()
        }, 5000)
      })

      console.log('Live-server instance created:', {
        hasEvents: !!liveServerInstance._events,
        eventTypes: liveServerInstance._events ? Object.keys(liveServerInstance._events) : [],
        port: config.port,
        listening: liveServerInstance ? liveServerInstance.listening : false,
      })

      // 存储服务器实例和相关组件
      const serverInstance: ServerInstance = {
        port: config.port,
        distId: config.id,
        server: liveServerInstance,
      }

      // 监听服务器关闭事件
      liveServerInstance.on('close', () => {
        console.log(`Server on port ${config.port} closed event triggered`)
        this.servers.delete(config.id)
      })

      this.servers.set(config.id, serverInstance)

      return true
    }
    catch (error) {
      console.error(`Failed to start server for ${config.name}:`, error)
      return false
    }
  }

  // 停止一个 live-server 实例
  async stopServer(id: string): Promise<boolean> {
    const server = this.servers.get(id)
    if (!server) {
      console.log(`No server found with ID: ${id}`)
      return false
    }

    try {
      if (server.server) {
        console.log(`Attempting to stop server on port ${server.port}...`)
        console.log('Server instance details:', {
          listening: server.server.listening,
          eventTypes: server.server._events ? Object.keys(server.server._events) : [],
          connections: server.server._connections,
        })

        let isShutdownComplete = false

        // 关闭所有连接并停止服务器
        try {
          await Promise.race([
            // 主要关闭逻辑
            new Promise<void>((resolve, reject) => {
              const closeConnections = () => {
                // 获取当前连接数
                server.server.getConnections((err: Error | null, count: number) => {
                  console.log(`Current active connections: ${count}`)
                  if (count > 0) {
                    // 强制关闭所有连接
                    server.server._handle?.shutdown?.()
                  }
                })
              }

              // 先关闭连接
              closeConnections()

              // 监听服务器关闭事件
              const onServerClosed = () => {
                console.log('Server closed event received')
                isShutdownComplete = true
                resolve()
              }

              // 添加一次性关闭事件监听器
              server.server.once('close', onServerClosed)

              // 调用服务器关闭方法
              console.log('Calling server.close()...')
              server.server.close((err?: Error) => {
                if (err) {
                  // 只有在服务器没有触发 close 事件的情况下才 reject
                  if (!isShutdownComplete) {
                    console.error('Error during server close:', err)
                    reject(err)
                  }
                }
                else {
                  console.log('Server close callback executed')
                }
              })

              // 每秒检查并尝试关闭连接
              const interval = setInterval(closeConnections, 1000)

              // 清理函数
              const cleanup = () => {
                clearInterval(interval)
                server.server.removeListener('close', onServerClosed)
              }

              // 成功时清理
              server.server.once('close', cleanup)

              // 失败时也要清理
              server.server.once('error', () => {
                cleanup()
                if (!isShutdownComplete) {
                  reject(new Error('Server close error'))
                }
              })
            }),

            // 超时保护（30秒）
            new Promise<void>((_, reject) => {
              setTimeout(() => {
                if (!isShutdownComplete) {
                  console.log('Server shutdown timeout (30s) reached')
                  reject(new Error('Server shutdown timeout'))
                }
              }, 30000)
            }),
          ])
        }
        catch (error) {
          console.error('Error during graceful shutdown:', error)
          // 即使优雅关闭失败，我们也继续执行，尝试强制关闭
        }

        // 如果服务器仍在监听，强制关闭
        if (server.server.listening) {
          console.log('Server still listening, forcing shutdown...')
          if (server.server._handle) {
            server.server._handle.close()
          }
        }

        // 检查端口状态
        await new Promise(resolve => setTimeout(resolve, 1000))
        const portInUse = await this.isPortInUse(server.port)
        console.log(`After shutdown: Port ${server.port} ${portInUse ? 'is still in use' : 'has been released'}`)

        // 如果端口仍然被占用，使用系统命令强制关闭
        if (portInUse) {
          await new Promise<void>((resolve) => {
            console.log('Port still in use, attempting to force kill process...')
            if (process.platform === 'win32') {
              exec(`FOR /F "tokens=5" %P IN ('netstat -a -n -o ^| findstr :${server.port} ^| findstr LISTENING') DO TaskKill /PID %P /F /T`, (error, stdout, stderr) => {
                if (error) {
                  console.error('Error killing process:', error)
                }
                else {
                  console.log('Process killed:', stdout)
                }
                resolve()
              })
            }
            else {
              exec(`lsof -ti:${server.port} | xargs kill -9`, (error, stdout, stderr) => {
                if (error) {
                  console.error('Error killing process:', error)
                }
                else {
                  console.log('Process killed:', stdout)
                }
                resolve()
              })
            }
          })

          // 最后再次检查端口
          await new Promise(resolve => setTimeout(resolve, 1000))
          const finalPortCheck = await this.isPortInUse(server.port)
          console.log(`Final port check: Port ${server.port} ${finalPortCheck ? 'is still in use' : 'has been released'}`)
        }

        // 无论如何，都从管理列表中移除服务器
        this.servers.delete(id)
        console.log(`Server ${id} removed from managed servers list`)

        // 如果服务器关闭成功或者被强制关闭，返回 true
        return !await this.isPortInUse(server.port)
      }
      return false
    }
    catch (error) {
      console.error('Error in stopServer:', error)
      // 出错时也要清理记录，但要返回 false
      this.servers.delete(id)
      return false
    }
  }

  // 获取服务器状态
  getServerStatus(distId: string): boolean {
    console.log(`Checking server status for ID: ${distId}`)
    return this.servers.has(distId)
  }

  // 创建代理中间件
  private createProxyMiddleware(proxyRules: ProxyConfig[]) {
    if (!proxyRules || proxyRules.length === 0) {
      return []
    }

    return proxyRules.map((rule) => {
      // 使用函数形式返回中间件
      return (req: any, res: any, next: any) => {
        const proxy = createProxyMiddleware(rule.path, {
          target: rule.target,
          changeOrigin: rule.changeOrigin ?? true,
          secure: rule.secure ?? false,
          logLevel: 'silent',
        })
        return proxy(req, res, next)
      }
    })
  }

  // 关闭所有服务器
  async stopAllServers(): Promise<void> {
    const serverIds = Array.from(this.servers.keys())
    await Promise.all(serverIds.map(id => this.stopServer(id)))
  }
}