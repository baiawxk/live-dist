# vite-plugin-electron-ipc 现有设计

## 插件用途和功能

### 主要用途
`vite-plugin-electron-ipc` 是一个专为 Electron 应用设计的 Vite 插件，旨在简化主进程和渲染进程之间的 IPC（Inter-Process Communication）通信。它通过自动化代码生成来减少手动编写 IPC 通道注册和调用代码的工作量。

### 核心功能
1. **自动扫描 IPC 函数**：
   - 自动扫描指定目录中的 TypeScript 文件
   - 识别并解析导出的函数声明和异步函数声明

2. **自动生成主进程注册代码**：
   - 为扫描到的每个函数自动生成 `ipcMain.handle` 注册代码
   - 提供两种调用方式：按文件名分组和兼容模式

3. **自动生成预加载脚本客户端代码**：
   - 生成 `ipcRenderer.invoke` 调用代码，供渲染进程使用
   - 提供按文件名分组和兼容模式两种访问方式

4. **自动生成 TypeScript 类型定义**：
   - 使用 `typeof import("${relativePath}").functionName` 方式引用类型
   - 提供精确的类型定义，无需手动维护
   - 自动生成对应的 TypeScript 类型定义文件

5. **虚拟模块支持**：
   - 通过虚拟模块机制提供代码访问
   - 为 `virtual:ipc-preload` 和 `virtual:ipc-main` 提供类型声明

## 解决的问题

该插件主要解决了传统 Electron IPC 实现中的几个痛点：
1. **手动注册繁琐**：避免了手动为每个 IPC 通道编写注册代码
2. **类型安全缺失**：提供完整的 TypeScript 类型定义和检查
3. **维护困难**：当接口变化时自动更新相关代码
4. **代码重复**：自动生成预加载脚本中的客户端代码

## 实际使用效果评估

### 达成的预期效果
1. **开发效率提升**：开发者只需关注业务逻辑实现
2. **类型安全性**：提供完整的类型提示和检查
3. **代码组织优化**：按功能模块分文件管理 IPC 函数

---

# 插件设计重构

## 主进程设计

1. 前提 main 进程的ipc函数都放在src/main/ipc ，有2个文件，例如，test1.ts 和 test2.ts
test1.ts 有两个方法 abc 和 bcd
test2.ts 有一个方法 efg

2. 主进程配置vite 插件  

viteElectronIPC({
   scanDir: ['src/main/ipc'], // 多个，使用fast-glob 进行扫描
   apiName: 'electronAPI',
   channelCallback: (fileName，methodName) => `${fileName}:${methodName}`, // 可选
})

3. vite 启动的时候，以上viteElectronIPC 会扫描src/main/ipc 目录下的ts 文件，生成一个虚拟模块 virtual:ipc-main
   eg.

```ts

import { abc } from 'E:/workspaces/live-dist/packages/src/main/ipc/test1.ts';
import { bcd } from 'E:/workspaces/live-dist/packages/src/main/ipc/test1.ts';
import { efg } from 'E:/workspaces/live-dist/packages/src/main/ipc/test2.ts';
import { ipcMain } from 'electron';

export function registerIPCFunctions() {
  ipcMain.handle('test1:abc', (_, ...args) => abc(...args));
  ipcMain.handle('test1:bcd', (_, ...args) => bcd(...args));
  ipcMain.handle('test2:efg', (_, ...args) => efg(...args));
}
```

4. 主进程会使用这个虚拟模块进行ipc 注册

```ts
import { app, BrowserWindow } from 'electron';
import { registerIPCFunctions } from 'virtual:ipc-main'; 

app.whenReady().then(() => {
  const mainWindow = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  registerIPCFunctions(); // 注册所有的ipc 函数

  mainWindow.loadURL('http://localhost:3000');
});
```

5. 同时生成另外一个虚拟模块 virtual:ipc-preload 到时候打包暴露出去，preload 进程使用该方法进行ipcRenderer 注册调用

```ts
import { ipcRenderer, contextBridge } from 'electron'

// 按文件名分组的API对象
export const electronAPI = {
  test1: {
    abc: (...args: any[]) => ipcRenderer.invoke('test1:abc', ...args),
    bcd: (...args: any[]) => ipcRenderer.invoke('test1:bcd', ...args),
  },
  test2: {
    efg: (...args: any[]) => ipcRenderer.invoke('test2:efg', ...args),
  },
};

export function exposeIPCFunctions() {
  contextBridge.exposeInMainWorld('electronAPI', electronAPI);
}
```

6. preload 进程使用该虚拟模块

```ts
import { exposeIPCFunctions } from '@app/ipc-preload'; // 此处是主进程打包后暴露的模块？实际是我们实现的是虚拟模块：virtual:ipc-preload 如何直接打包暴露？是否不需要主进程显示import 然后export ？ 待调研

exposeIPCFunctions(); // 此处假设可以直接使用主进程暴露的模块
```

7. 生成一个类型声明给 renderer 进程使用

```ts
// ipc-types.d.ts
export interface ElectronAPI {  // ElectronAPI from vite options apiName
  test1: {
    abc: typeof import('E:/workspaces/live-dist/packages/src/main/ipc/test1.ts').abc;
    bcd: typeof import('E:/workspaces/live-dist/packages/src/main/ipc/test1.ts').bcd;
  };     
  test2: {
    efg: typeof import('E:/workspaces/live-dist/packages/src/main/ipc/test2.ts').efg;
  };
}  

declare global {
  interface Window {
    ElectronAPI: ElectronAPI;  // ElectronAPI from vite options apiName
  }
}
```


8. renderer 进程使用

```ts
// renderer.ts
window.ElectronAPI.test1.abc(arg1, arg2).then(result => {
  console.log(result);
});
window.ElectronAPI.test2.efg(arg1).then(result => {
  console.log(result);
});
