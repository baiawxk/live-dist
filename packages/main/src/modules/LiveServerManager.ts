import { spawn, ChildProcess } from 'node:child_process';
import * as liveServer from 'live-server';
import { ProxyConfig, DistConfig } from './DistManager.js';
import { createProxyMiddleware } from 'http-proxy-middleware';

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
        middleware: this.createProxyMiddleware(config.proxyRules)
      };

      // 启动服务器
      const server = liveServer.start(serverConfig);

      this.servers.set(config.id, {
        port: config.port,
        distId: config.id,
        process: server
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
      return createProxyMiddleware(rule.path, {
        target: rule.target,
        changeOrigin: rule.changeOrigin ?? true,
        secure: rule.secure ?? false,
        logLevel: 'silent'
      });
    });
  }

  // 关闭所有服务器
  async stopAllServers(): Promise<void> {
    const serverIds = Array.from(this.servers.keys());
    await Promise.all(serverIds.map(id => this.stopServer(id)));
  }
}
