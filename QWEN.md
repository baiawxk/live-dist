# Vite Electron Builder Boilerplate - QWEN 上下文

## 项目概述

这是一个基于 Vite 和 Electron 的安全 Electron 应用程序模板，名为 "dist-mgr"。它遵循最新的安全要求、建议和最佳实践。项目设计为 monorepo，应用程序的每个部分都是一个独立的包，允许在每个包中使用不同的技术栈、测试、依赖和框架。

主要技术栈：
- **Electron 38**: 用于构建跨平台桌面应用
- **Vite 7**: 用于快速构建和开发
- **Vue.js 3**: 作为前端框架（在 renderer 包中使用）
- **Element Plus**: 用于 UI 组件
- **TypeScript 5**: 用于类型安全
- **Playwright**: 用于端到端测试
- **Zod**: 用于 IPC 通信的数据验证
- **pnpm**: 作为包管理器
- **Turbo**: 用于 monorepo 任务执行
- **electron-builder**: 用于打包和分发

## 项目结构

```
live-dist/
├── .github/                 # GitHub 工作流和配置
├── .vscode/                 # VSCode 设置
├── buildResources/          # Electron 构建资源
├── packages/                # Monorepo 包
│   ├── api/                 # IPC 通信层，使用 Zod 进行数据验证
│   ├── electron-versions/   # Electron 版本相关工具
│   ├── integrate-renderer/  # 渲染器集成工具
│   ├── main/                # Electron 主进程逻辑
│   ├── preload/             # Electron 预加载脚本
│   └── renderer/            # 应用程序界面（Vue.js）
├── tests/                   # 端到端测试
├── types/                   # 类型定义
├── .editorconfig           # 编辑器配置
├── .gitignore              # Git 忽略规则
├── .npmrc                  # npm 配置
├── CONTRIBUTING.md         # 贡献指南
├── electron-builder.mjs    # Electron 构建配置
├── eslint.config.ts        # ESLint 配置
├── IFLOW.md                # 实现流程文档
├── LICENSE                 # 项目许可证
├── package.json            # 根包配置
├── pnpm-lock.yaml          # pnpm 锁文件
├── pnpm-workspace.yaml     # pnpm 工作区配置
├── README.md               # 主项目文档
├── turbo.json              # Turbo 配置
└── QWEN.md                 # 本文件
```

## 核心模块

### DistManager
使用 electron-store 管理目录配置，支持添加、编辑、删除目录配置，以及配置代理规则。管理静态文件目录的 live 服务器。

### LiveServerManager
基于 live-server 管理本地服务器实例。支持启动和停止服务器、处理端口冲突和优雅关闭服务器实例。

### AutoIPCHandler
实现使用 Zod 进行类型安全的 IPC 通信，确保主进程和渲染进程之间通信的安全性。

## 构建和运行命令

### 开发模式
```bash
pnpm start
```
以开发模式启动应用程序，带有热重载功能。

### 构建项目
```bash
pnpm build
```
在所有工作区中运行构建命令。

### 编译可执行文件
```bash
pnpm compile
```
首先运行构建脚本，然后使用 `electron-builder` 将项目编译成可执行文件。

### 测试
```bash
pnpm test
```
使用 Playwright 在编译后的应用程序上执行端到端测试。

### 类型检查
```bash
pnpm typecheck
```
在所有工作区中运行类型检查命令。

### 初始化环境
```bash
pnpm init
```
通过创建新渲染器、集成它并安装必要包来设置初始环境。

## 开发约定

1. **模块化架构**: 应用程序遵循模块化设计，每个功能都是独立模块。
2. **安全性优先**: 遵循 Electron 安全指南，使用上下文隔离和预加载脚本。
3. **TypeScript**: 全项目使用 TypeScript 进行类型检查。
4. **Monorepo**: 使用 pnpm workspaces 管理多个包。
5. **环境变量**: 使用 `import.meta.env` 访问环境变量，只有以 `VITE_` 为前缀的变量才会暴露给客户端代码。
6. **API 设计**: 使用 Zod 进行严格的类型验证，确保 IPC 通信的安全性和可靠性。
7. **IPC 通信**: 采用基于 Zod 的类型安全 IPC 通信机制，确保主进程和渲染进程之间的通信安全可靠。

## Monorepo 包

- **api**: 定义 IPC 通信接口和数据结构，使用 Zod 进行类型安全验证
- **main**: Electron 主进程，包含应用核心逻辑，如目录管理、服务器管理、IPC 处理等
- **preload**: Electron 预加载脚本，安全地向渲染进程暴露 API
- **renderer**: Vue.js 应用程序界面，使用 Element Plus 构建
- **electron-versions**: 管理 Electron 版本相关的工具
- **integrate-renderer**: 渲染器集成工具，用于初始化和集成渲染器

## 主要特性

1. **安全架构**: 实现 Electron 安全最佳实践
2. **热模块替换**: 开发期间支持 HMR
3. **自动更新**: 内置自动更新功能
4. **跨平台**: 构建多平台应用程序
5. **类型安全**: 完整的 TypeScript 类型检查
6. **测试**: 使用 Playwright 进行端到端测试
7. **持续集成**: 支持 CI/CD，使用 GitHub Actions
8. **轻量化**: 最小化依赖项，专注于原生功能

## IPC 通信模式

项目使用定义良好的 IPC 通信模式：
1. 在 `@app/api` 中定义 API，使用 Zod 验证
2. 在 `@app/main` 中实现主进程逻辑
3. 通过 `@app/preload` 安全暴露
4. 渲染进程通过从 `@app/preload` 导入来使用

这确保了进程间通信的类型安全和安全性。

## 开发注意事项

- 项目需要 Node.js >=22.0.0
- 渲染器包必须可作为 `@app/renderer` 导入
- 只有 VITE_ 前缀的环境变量暴露给客户端代码
- 架构遵循安全原则，从预加载脚本暴露函数，而不是直接访问 Node.js API
- 开发模式使用特殊服务器处理渲染器热重载
- 中国开发者请注意，这是一个由乌克兰开发者维护的开源项目，项目中包含对乌克兰的支持信息