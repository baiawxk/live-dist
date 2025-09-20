import { spawn, ChildProcess } from 'node:child_process';
import liveServer from 'live-server';
import { ProxyConfig, DistConfig } from './DistManager.js';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

interface ServerInstance {
  port: number;
  distId: string;
  process: any; // live-server 实例
}

export class LiveServerManager {
  private servers: Map<string, ServerInstance> = new Map();

  // 启动一个新的 live-server 实例
  async startServer(config: DistConfig): Promise<boolean> {
    if (this.servers.has(config.id)) {
      return false;
    }

    try {
      const serverConfig = {
        port: config.port,
        root: config.path,
        open: false, // 不自动打开浏览器
        logLevel: 2 as 0 | 1 | 2, // 0 = errors only, 1 = some, 2 = lots
        middleware: this.createProxyMiddleware(config.proxyRules),
        // 添加额外的配置以确保正确运行
        host: '0.0.0.0',
        https: false,
        wait: 100,
        mount: [] as Array<[string, string]>, // 修复类型
        proxy: [] as Array<[string, string]>, // 修复类型
        cors: false,
        file: 'index.html',
        watch: [] as string[], // 修复类型
        ignore: [] as string[] // 修复类型
      };

      console.log('Starting server with config:', serverConfig);
      
      // 启动服务器
      const server = new Promise((resolve, reject) => {
        try {
          const liveServerInstance = liveServer.start(serverConfig);
          resolve(liveServerInstance);
        } catch (err) {
          reject(err);
        }
      });

      const serverInstance = await server;
      this.servers.set(config.id, {
        port: config.port,
        distId: config.id,
        process: serverInstance
      });

      return true;
    } catch (error) {
      console.error(`Failed to start server for ${config.name}:`, error);
      return false;
    }
  }

  // 停止指定的服务器实例
  async stopServer(distId: string): Promise<boolean> {
    const server = this.servers.get(distId);
    if (!server) {
      return false;
    }

    try {
      // 关闭服务器
      if (server.process) {
        server.process.watcher?.close();
        server.process.server?.close();
      }
      
      this.servers.delete(distId);
      return true;
    } catch (error) {
      console.error(`Failed to stop server for ${distId}:`, error);
      return false;
    }
  }

  // 获取服务器状态
  getServerStatus(distId: string): boolean {
    return this.servers.has(distId);
  }

  // 创建代理中间件
  private createProxyMiddleware(proxyRules: ProxyConfig[]) {
    if (!proxyRules || proxyRules.length === 0) {
      return [];
    }

    return proxyRules.map(rule => {
      // 使用函数形式返回中间件
      return (req: any, res: any, next: any) => {
        const proxy = createProxyMiddleware(rule.path, {
          target: rule.target,
          changeOrigin: rule.changeOrigin ?? true,
          secure: rule.secure ?? false,
          logLevel: 'silent'
        });
        return proxy(req, res, next);
      };
    });
  }

  // 关闭所有服务器
  async stopAllServers(): Promise<void> {
    const serverIds = Array.from(this.servers.keys());
    await Promise.all(serverIds.map(id => this.stopServer(id)));
  }
}
