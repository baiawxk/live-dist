# 项目概述

这是一个基于 Vite 和 Electron 的安全 Electron 应用程序模板。它遵循最新的安全要求、建议和最佳实践，采用 monorepo 结构，每个应用程序部分都是一个独立的包。

主要技术栈：
- **Electron**: 用于构建跨平台桌面应用
- **Vite**: 用于快速构建和开发
- **Vue.js**: 作为前端框架（renderer 包中使用）
- **TypeScript**: 用于类型安全
- **Playwright**: 用于端到端测试

## 项目结构

```
packages/
├── main/                 # Electron 主进程逻辑
├── preload/              # Electron 预加载脚本
├── renderer/             # 应用程序界面（Vue.js）
├── electron-versions/    # Electron 版本相关工具
├── integrate-renderer/   # 渲染器集成工具
└── vite-plugin-electron-ipc/ # Electron IPC 自动注册插件
```

## 核心功能

### Dist 管理系统
项目包含一个完整的 Dist 管理系统，允许用户：
- 添加、编辑、删除 Dist 配置
- 启动和停止基于 live-server 的本地服务器
- 配置代理规则
- 管理服务器状态

### IPC 通信机制
项目使用自定义的 Vite 插件 `vite-plugin-electron-ipc` 实现自动 IPC 注册：
- 自动扫描主进程中的 IPC 函数
- 自动生成预加载脚本中的 IPC 调用代码
- 自动生成 TypeScript 类型定义
- 支持按文件名分组的 API 对象

## 构建和运行

### 开发模式
```bash
npm start
```
启动开发模式的应用程序，带有热重载功能。

### 构建项目
```bash
npm run build
```
在所有工作区中运行构建命令。

### 编译可执行文件
```bash
npm run compile
```
首先运行构建脚本，然后使用 `electron-builder` 将项目编译成可执行文件。

### 运行测试
```bash
npm run test
```
使用 Playwright 在编译后的应用程序上执行端到端测试。

```bash
npm run test:unit
```
在所有工作区中运行单元测试。

### 类型检查
```bash
npm run typecheck
```
在所有工作区中运行类型检查命令。

### 初始化环境
```bash
npm run init
```
通过创建新的渲染器、集成它并安装必要的包来设置初始环境。

## 开发约定

1. **模块化架构**: 应用程序采用模块化设计，每个功能都是一个独立的模块。
2. **安全性**: 遵循 Electron 安全指南，使用上下文隔离和预加载脚本。
3. **TypeScript**: 全项目使用 TypeScript 进行类型检查。
4. **Monorepo**: 使用 pnpm workspaces 管理多个包。
5. **环境变量**: 使用 `import.meta.env` 访问环境变量，只有以 `VITE_` 为前缀的变量才会暴露给客户端代码。
6. **IPC 通信**: 使用 `vite-plugin-electron-ipc` 插件自动处理 IPC 通信，无需手动注册。
7. **测试驱动开发**: 使用 `vitest` 和 `playwright` 进行单元测试和端到端测试。每个新的实现都应伴随相应的测试。不破坏旧的功能。
