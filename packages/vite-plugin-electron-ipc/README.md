# Vite Plugin Electron IPC

A Vite plugin for automatic Electron IPC registration with configurable paths.

## Features

- Automatically scans and registers IPC functions from your modules
- Generates type definitions for IPC functions
- Configurable paths for scanning and output files
- Excludes specified functions from IPC registration

## Installation

```bash
npm install @app/vite-plugin-electron-ipc
```

## Usage

### Basic Usage

```ts
// vite.config.ts
import electronIPCPlugin from '@app/vite-plugin-electron-ipc'

export default defineConfig({
  plugins: [
    electronIPCPlugin()
  ]
})
```

### Configuration Options

```ts
// vite.config.ts
import electronIPCPlugin from '@app/vite-plugin-electron-ipc'

export default defineConfig({
  plugins: [
    electronIPCPlugin({
      // 扫描API函数的目录路径
      // 默认值: '../../main/src/modules'
      scanDir: '../../main/src/modules',
      
      // 生成的主进程注册文件路径
      // 默认值: '../../main/src/generated/ipc-registry.ts'
      mainRegistryFile: '../../main/src/generated/ipc-registry.ts',
      
      // 生成的preload客户端文件路径
      // 默认值: '../../preload/src/generated/ipc-client.ts'
      preloadClientFile: '../../preload/src/generated/ipc-client.ts',
      
      // 生成的类型定义文件路径
      // 默认值: '../../preload/src/generated/ipc-types.d.ts'
      typeDefinitionFile: '../../preload/src/generated/ipc-types.d.ts',
      
      // 扫描的文件模式
      // 默认值: '**/*.ts'
      filePattern: '**/*.ts',
      
      // 忽略的文件模式
      // 默认值: ['**/node_modules/**', '**/dist/**']
      ignorePattern: ['**/node_modules/**', '**/dist/**'],
      
      // 应该排除的函数名（不注册为IPC）
      // 默认值: ['registerAPI', 'registerAPIs', 'cleanupAPIs']
      excludeFunctions: ['registerAPI', 'registerAPIs', 'cleanupAPIs'],
      
      // 应该包含的函数名（只注册这些函数为IPC）
      // 如果指定，只有这些函数会被注册，忽略其他所有函数
      // 默认值: []
      includeFunctions: []
    })
  ]
})
```

## How it works

1. The plugin scans the specified directory for TypeScript files
2. It analyzes the files to find exported functions
3. It generates:
   - IPC registration code for the main process
   - Client functions for the preload process
   - Type definitions for both processes
4. The generated files are written to the specified locations

## Best Practices

1. Export only the functions you want to expose via IPC
2. Use the `excludeFunctions` option to prevent internal functions from being exposed
3. Use the `includeFunctions` option to explicitly specify which functions should be exposed
4. Make sure your function names are unique across all modules