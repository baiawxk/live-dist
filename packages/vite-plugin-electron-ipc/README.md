# Vite Plugin Electron IPC

A Vite plugin for automatic Electron IPC registration with configurable paths.

## Features

- Automatically scans and registers IPC functions from your modules
- Generates type definitions for IPC functions
- Configurable paths for scanning and output files
- Excludes specified functions from IPC registration
- Generates actual files instead of using virtual modules

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
      // 默认值: '../main/src/ipc'
      scanDir: '../main/src/ipc',
      
      // 生成的主进程注册文件路径
      // 默认值: '../main/src/generated/ipc-registry.ts'
      mainRegistryFile: '../main/src/generated/ipc-registry.ts',
      
      // 生成的preload客户端文件路径
      // 默认值: '../preload/src/generated/ipc-client.ts'
      preloadClientFile: '../preload/src/generated/ipc-client.ts',
      
      // 生成的类型定义文件路径
      // 默认值: '../preload/src/generated/ipc-types.d.ts'
      typeDefinitionFile: '../preload/src/generated/ipc-types.d.ts',
      
      // 扫描的文件模式
      // 默认值: '**/*.ts'
      filePattern: '**/*.ts',
      
      // 忽略的文件模式
      // 默认值: ['**/node_modules/**', '**/dist/**']
      ignorePattern: ['**/node_modules/**', '**/dist/**'],
      
      // 应该排除的函数名（不注册为IPC）
      // 默认值: []
      excludeFunctions: [],
    })
  ]
})
```

## How it works

1. The plugin scans the specified directory for TypeScript files during the build process
2. It analyzes the files to find exported functions
3. It generates three files:
   - IPC registration code for the main process (mainRegistryFile)
   - Client functions for the preload process (preloadClientFile)
   - Type definitions for both processes (typeDefinitionFile)
4. The generated files are written to the specified locations
5. Main process imports the registration file to register IPC handlers
6. Preload process imports the client file to expose IPC functions to renderer process

## Integration

### Main Process Integration

```ts
// In your main process module (e.g., IPCHandlerModule.ts)
import { registerIPCFunctions } from '../generated/ipc-registry.js'

export function createIPCHandlerModule() {
  return {
    enable() {
      // Register all IPC functions
      registerIPCFunctions()
    }
  }
}
```

### Preload Process Integration

```ts
// In your preload index.ts
// Import all IPC client functions from generated file
export * from './generated/ipc-client.js'
```

### Renderer Process Usage

```ts
// In your renderer process (e.g., Vue component)
// Functions are available through the exposed API
window.app.openInBrowser('https://example.com')
window.distMgr.getAllDists()
window.server.startServer('server-id')
```

## Best Practices

1. Export only the functions you want to expose via IPC
2. Use the `excludeFunctions` option to prevent internal functions from being exposed
3. Organize your IPC functions in separate files based on functionality
4. Make sure your function names are unique across all modules