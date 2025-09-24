# 项目概述

这是一个基于 Vite 和 Electron 的安全 Electron 应用程序模板，专门用于管理多个静态文件目录并为它们提供本地服务器功能。它遵循最新的安全要求、建议和最佳实践，采用 monorepo 结构，每个应用程序部分都是一个独立的包。

主要技术栈：
- **Electron**: 用于构建跨平台桌面应用
- **Vite**: 用于快速构建和开发
- **Vue.js**: 作为前端框架（renderer 包中使用）
- **Element Plus**: 用于 UI 组件
- **TypeScript**: 用于类型安全
- **Playwright**: 用于端到端测试

## 项目功能

该应用程序是一个目录管理工具，允许用户：
1. 添加和管理多个静态文件目录配置
2. 为每个目录启动和停止本地服务器
3. 配置代理规则以处理 API 请求
4. 在浏览器中打开目录对应的本地服务器地址
5. 批量启动或停止所有服务

## 项目结构

```
packages/
├── api/                # IPC 通信层，使用 Zod 进行数据验证
├── main/               # Electron 主进程逻辑
├── preload/            # Electron 预加载脚本
├── renderer/           # 应用程序界面（Vue.js）
├── electron-versions/  # Electron 版本相关工具
└── integrate-renderer/ # 渲染器集成工具
```

### 核心模块

- **DistManager**: 管理目录配置，使用 electron-store 存储数据
- **LiveServerManager**: 管理本地服务器实例，基于 live-server
- **IPCHandler**: 处理主进程和渲染进程之间的通信
- **WindowManager**: 管理应用程序窗口

## 构建和运行

### 开发模式
```bash
pnpm start
```
启动开发模式的应用程序，带有热重载功能。

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

### 运行测试
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
通过创建新的渲染器、集成它并安装必要的包来设置初始环境。

## 开发约定

1. **模块化架构**: 应用程序采用模块化设计，每个功能都是一个独立的模块。
2. **安全性**: 遵循 Electron 安全指南，使用上下文隔离和预加载脚本。
3. **TypeScript**: 全项目使用 TypeScript 进行类型检查。
4. **Monorepo**: 使用 pnpm workspaces 管理多个包。
5. **环境变量**: 使用 `import.meta.env` 访问环境变量，只有以 `VITE_` 为前缀的变量才会暴露给客户端代码。

## 核心功能实现

### 目录管理
通过 `DistManager` 类管理目录配置，支持：
- 添加、编辑、删除目录配置
- 启动和停止目录对应的本地服务器
- 配置代理规则

### 服务器管理
通过 `LiveServerManager` 类管理本地服务器实例：
- 为每个目录启动独立的 live-server 实例
- 支持自定义端口和代理配置
- 提供启动和停止服务器的功能

### 进程间通信
通过 `IPCHandler` 类处理主进程和渲染进程之间的通信：
- 暴露目录管理相关的 API 给渲染进程
- 处理文件选择对话框
- 在浏览器中打开指定 URL
- 使用 Zod 进行数据验证确保 IPC 通信安全

### 用户界面
使用 Vue.js 和 Element Plus 构建的现代化界面：
- 目录列表展示和管理
- 添加/编辑目录的表单对话框
- 服务器状态显示和控制
- 批量操作按钮