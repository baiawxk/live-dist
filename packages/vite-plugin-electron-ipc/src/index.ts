import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'
import { fileURLToPath } from 'node:url'
import { parse } from '@babel/parser'
import generate from '@babel/generator'
import * as t from '@babel/types'
import MagicString from 'magic-string'
import fg from 'fast-glob'
import type { NodePath, Node } from '@babel/traverse'
import type { File } from '@babel/types'

interface IPCFunction {
  name: string
  filePath: string
  exportName: string
  parameters: string
  returnType: string
}

interface IPCPluginOptions {
  // 扫描API函数的目录路径
  scanDir?: string
  // 扫描的文件模式
  filePattern?: string | string[]
  // 忽略的文件模式
  ignorePattern?: string[]
  // 应该排除的函数名（不注册为IPC）
  excludeFunctions?: string[]
  // 类型定义文件输出路径（仅preload进程需要）
  typeDefinitionFile?: string
}

export default function electronIPCPlugin(options: IPCPluginOptions = {}): Plugin {
  const virtualMainModuleId = 'virtual:ipc-main'
  const resolvedVirtualMainModuleId = `\0${virtualMainModuleId}`
  const virtualPreloadModuleId = 'virtual:ipc-preload'
  const resolvedVirtualPreloadModuleId = `\0${virtualPreloadModuleId}`
  const virtualTypesModuleId = 'virtual:ipc-types'
  const resolvedVirtualTypesModuleId = `\0${virtualTypesModuleId}`
  
  const apiFunctions: IPCFunction[] = []
  const __dirname = fileURLToPath(new URL('.', import.meta.url))
  
  // 默认配置
  const defaultOptions: Required<IPCPluginOptions> = {
    scanDir: '../../main/src/modules',
    filePattern: '**/*.ts',
    ignorePattern: ['**/node_modules/**', '**/dist/**'],
    excludeFunctions: ['registerAPI', 'registerAPIs', 'cleanupAPIs'],
    typeDefinitionFile: ''
  }
  
  // 合并配置
  const config = { ...defaultOptions, ...options }
  
  // 定义插件内部方法
  const scanAPIFunctions = async () => {
    try {
      const scanPath = resolve(__dirname, config.scanDir)
      console.log(`Scanning for IPC functions in: ${scanPath}`)
      
      // 使用fast-glob扫描所有.ts文件
      const files = await fg(config.filePattern, {
        cwd: scanPath,
        absolute: true,
        ignore: config.ignorePattern
      })
      
      console.log(`Found ${files.length} files:`)
      for (const file of files) {
        console.log(`  - ${file}`)
      }
      
      // 清空之前的函数列表
      apiFunctions.length = 0
      
      // 分析每个文件中的导出函数
      for (const file of files) {
        await analyzeFile(file, apiFunctions)
      }
      
      console.log(`Found ${apiFunctions.length} IPC functions:`)
      for (const fn of apiFunctions) {
        console.log(`  - ${fn.name}: ${fn.filePath}`)
      }
    } catch (error) {
      console.error('Error scanning API functions:', error)
    }
  }
  
  const analyzeFile = async (filePath: string, apiFunctions: IPCFunction[]) => {
    try {
      const content = await readFile(filePath, 'utf-8')
      
      // 使用@babel/parser解析AST
      const ast = parse(content, {
        sourceType: 'module',
        plugins: ['typescript']
      }) as any
      
      // 动态导入并使用@babel/traverse遍历AST
      let _traverse: any;
      try {
        const module = await import('@babel/traverse')
        _traverse = module.default
      } catch (importError) {
        console.error('Failed to import @babel/traverse:', importError)
        return
      }
      
      if (!_traverse) {
        console.error('@babel/traverse is not available')
        return
      }
      
      // 检查generate的类型并正确调用
      const generateCode = (node: any) => {
        if (typeof generate === 'function') {
          const result = generate(node)
          return result.code
        } else if (typeof (generate as any).default === 'function') {
          const result = (generate as any).default(node)
          return result.code
        } else {
          console.error('Unknown generate type:', typeof generate)
          return ''
        }
      }
      
      // 检查_traverse的类型并正确调用
      const traverseAST = (ast: any, visitor: any) => {
        if (typeof _traverse === 'object' && typeof _traverse.default === 'function') {
          _traverse.default(ast, visitor)
        } else if (typeof _traverse === 'function') {
          _traverse(ast, visitor)
        } else {
          console.error('Unknown @babel/traverse type:', typeof _traverse)
        }
      }
      
      traverseAST(ast, {
        ExportNamedDeclaration(path: NodePath<Node>) {
          // 处理函数声明的导出
          if (t.isFunctionDeclaration((path.node as any).declaration)) {
            const func = (path.node as any).declaration
            if (func.id?.name) {
              const functionName = func.id.name
              const params = func.params
              const returnType = func.returnType
              
              // 提取参数信息
              const paramStr = params.map((param: any) => {
                if (t.isIdentifier(param)) {
                  return param.name
                }
                try {
                  return generateCode(param)
                } catch (generateError: any) {
                  console.warn(`Failed to generate parameter code, using placeholder:`, generateError.message)
                  return 'arg'
                }
              }).join(', ')
              
              // 提取返回类型信息
              let returnTypeStr = 'any'
              if (returnType) {
                try {
                  const returnTypeCode = generateCode(returnType)
                  returnTypeStr = returnTypeCode.replace(':', '').trim()
                } catch (generateError: any) {
                  console.warn(`Failed to generate return type for ${functionName}, using 'any':`, generateError.message)
                  returnTypeStr = 'any'
                }
              }
              
              apiFunctions.push({
                name: functionName,
                filePath,
                exportName: functionName,
                parameters: paramStr,
                returnType: returnTypeStr
              })
            }
          }
          
          // 处理异步函数声明的导出
          if (t.isTSDeclareFunction((path.node as any).declaration)) {
            const func = (path.node as any).declaration
            if (func.id?.name) {
              const functionName = func.id.name
              const params = func.params
              const returnType = func.returnType
              
              // 提取参数信息
              const paramStr = params.map((param: any) => {
                if (t.isIdentifier(param)) {
                  return param.name
                }
                try {
                  return generateCode(param)
                } catch (generateError: any) {
                  console.warn(`Failed to generate parameter code, using placeholder:`, generateError.message)
                  return 'arg'
                }
              }).join(', ')
              
              // 提取返回类型信息
              let returnTypeStr = 'any'
              if (returnType) {
                try {
                  const returnTypeCode = generateCode(returnType)
                  returnTypeStr = returnTypeCode.replace(':', '').trim()
                } catch (generateError: any) {
                  console.warn(`Failed to generate return type for ${functionName}, using 'any':`, generateError.message)
                  returnTypeStr = 'any'
                }
              }
              
              apiFunctions.push({
                name: functionName,
                filePath,
                exportName: functionName,
                parameters: paramStr,
                returnType: returnTypeStr
              })
            }
          }
        }
      })
    } catch (error) {
      console.error(`Error analyzing file ${filePath}:`, error)
    }
  }
  
  const generateMainRegistrationCode = (): string => {
    try {
      // 使用magic-string生成代码
      const s = new MagicString('')
      
      // 过滤函数：排除excludeFunctions中的函数
      const filteredFunctions = apiFunctions.filter(fn => !config.excludeFunctions.includes(fn.exportName))
      
      // 生成导入语句
      const imports = filteredFunctions.map(fn => 
        `import { ${fn.exportName} } from '${fn.filePath}';`
      ).join('\n')
      
      // 生成注册语句
      const registrations = filteredFunctions.map(fn => 
        `ipcMain.handle('${fn.name}', (_, ...args) => ${fn.exportName}(...args));`
      ).join('\n')
      
      s.append(`
${imports}
import { ipcMain } from 'electron';

export function registerIPCFunctions() {
  ${registrations}
}
`)
      
      return s.toString()
    } catch (error) {
      console.error('Error generating main registration code:', error)
      return ''
    }
  }
  
  const generatePreloadClientCode = (): string => {
    try {
      // 使用magic-string生成代码
      const s = new MagicString('')
      
      // 过滤函数：排除excludeFunctions中的函数
      const filteredFunctions = apiFunctions.filter(fn => !config.excludeFunctions.includes(fn.exportName))
      
      // 生成ipcClient对象
      const ipcClientFunctions = filteredFunctions.map(fn => 
        `${fn.name}: (...args) => ipcRenderer.invoke('${fn.name}', ...args)`
      ).join(',\n  ')
      
      // 生成apiClient对象
      const apiClientFunctions = filteredFunctions.map(fn => 
        `'${fn.name}': (...args) => ipcRenderer.invoke('${fn.name}', ...args)`
      ).join(',\n  ')
      
      // 生成distMgr对象
      const distMgrFunctions = `
  getAllDists: () => ipcRenderer.invoke('getAllDists'),
  addDist: (config) => ipcRenderer.invoke('addDist', config),
  updateDist: (config) => ipcRenderer.invoke('updateDist', config),
  removeDist: (id) => ipcRenderer.invoke('removeDist', id),
  selectDirectory: () => ipcRenderer.invoke('selectDistDirectory'),
  startServer: (id) => ipcRenderer.invoke('startServer', id),
  stopServer: (id) => ipcRenderer.invoke('stopServer', id),
  openInBrowser: (url) => ipcRenderer.invoke('openInBrowser', url),
  getDist: (id) => ipcRenderer.invoke('getDist', id),
  updateDistStatus: (id, isActive) => ipcRenderer.invoke('updateDistStatus', id, isActive),
  getServerStatus: (id) => ipcRenderer.invoke('getServerStatus', id),
  selectAppDirectory: () => ipcRenderer.invoke('selectAppDirectory')
`
      
      s.append(`
import { ipcRenderer } from 'electron';

// IPC客户端对象
export const ipcClient = {
  ${ipcClientFunctions}
};

// API客户端对象
export const apiClient = {
  ${apiClientFunctions}
};

// distMgr兼容对象
export const distMgr = {
${distMgrFunctions}
};
`)
      
      return s.toString()
    } catch (error) {
      console.error('Error generating preload client code:', error)
      return ''
    }
  }
  
  const generateTypeDefinitions = (): string => {
    try {
      // 使用magic-string生成代码
      const s = new MagicString('')
      
      // 过滤函数：排除excludeFunctions中的函数
      const filteredFunctions = apiFunctions.filter(fn => !config.excludeFunctions.includes(fn.exportName))
      
      // 生成函数类型定义
      const functionTypes = filteredFunctions.map(fn => 
        `export function ${fn.name}(${fn.parameters}): Promise<${fn.returnType}>;`
      ).join('\n')
      
      // 生成ipcClient类型定义
      const ipcClientType = filteredFunctions.map(fn => 
        `${fn.name}(${fn.parameters}): Promise<${fn.returnType}>;`
      ).join('\n  ')
      
      // 生成apiClient类型定义
      const apiClientType = `{\n  ${filteredFunctions.map(fn => `'${fn.name}': (${fn.parameters}) => Promise<${fn.returnType}>;`).join('\n  ')}\n}`
      
      // 生成distMgr类型定义
      const distMgrType = `{\n  getAllDists(): Promise<DistConfig[]>;\n  addDist(config: Omit<DistConfig, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>): Promise<DistConfig>;\n  updateDist(config: Partial<Omit<DistConfig, 'id' | 'createdAt'>> & { id: string }): Promise<DistConfig | null>;\n  removeDist(id: string): Promise<boolean>;\n  selectDirectory(): Promise<string | null>;\n  startServer(id: string): Promise<boolean>;\n  stopServer(id: string): Promise<boolean>;\n  openInBrowser(url: string): Promise<void>;\n  getDist(id: string): Promise<DistConfig | null>;\n  updateDistStatus(id: string, isActive: boolean): Promise<boolean>;\n  getServerStatus(id: string): Promise<boolean>;\n  selectAppDirectory(): Promise<string | null>;\n}`
      
      s.append(`\n// Automatically generated IPC type definitions\nimport { ipcRenderer } from 'electron';\n\n// 定义所有IPC方法的类型\ninterface ProxyConfig {\n  path: string\n  target: string\n  changeOrigin?: boolean\n  secure?: boolean\n}\n\ninterface DistConfig {\n  id: string\n  name: string\n  path: string\n  port: number\n  isActive: boolean\n  proxyRules: ProxyConfig[]\n  createdAt: number\n  updatedAt: number\n}\n\n${functionTypes}\n\nexport const ipcClient: {\n  ${ipcClientType}\n};\n\nexport const apiClient: ${apiClientType};\n\nexport const distMgr: ${distMgrType};\n`)
      
      return s.toString()
    } catch (error) {
      console.error('Error generating type definitions:', error)
      return ''
    }
  }
  
  const writeTypeDefinitions = async (typeDefinitions: string) => {
    try {
      // 只有当配置了typeDefinitionFile时才写入文件
      if (config.typeDefinitionFile) {
        const typeDefPath = resolve(__dirname, config.typeDefinitionFile)
        await writeFile(typeDefPath, typeDefinitions)
        console.log(`Type definitions written to ${typeDefPath}`)
      }
    } catch (error) {
      console.error('Error writing type definitions:', error)
    }
  }

  return {
    name: 'electron-ipc-registry',
    
    async configResolved(resolvedConfig) {
      try {
        // 在开发模式下扫描API函数
        if (resolvedConfig.mode === 'development') {
          await scanAPIFunctions()
        }
      } catch (error) {
        console.error('Error in configResolved:', error)
      }
    },
    
    resolveId(id) {
      if (id === virtualMainModuleId) {
        return resolvedVirtualMainModuleId
      }
      if (id === virtualPreloadModuleId) {
        return resolvedVirtualPreloadModuleId
      }
      if (id === virtualTypesModuleId) {
        return resolvedVirtualTypesModuleId
      }
    },
    
    async load(id) {
      if (id === resolvedVirtualMainModuleId) {
        try {
          // 重新扫描API函数以确保最新
          await scanAPIFunctions()
          // 生成主进程注册代码
          const mainRegistrationCode = generateMainRegistrationCode()
          return mainRegistrationCode
        } catch (error) {
          console.error('Error in load for main module:', error)
          return ''
        }
      }
      
      if (id === resolvedVirtualPreloadModuleId) {
        try {
          // 重新扫描API函数以确保最新
          await scanAPIFunctions()
          // 生成preload客户端代码
          const preloadClientCode = generatePreloadClientCode()
          // 生成类型定义
          const typeDefinitions = generateTypeDefinitions()
          // 写入类型定义文件
          await writeTypeDefinitions(typeDefinitions)
          return preloadClientCode
        } catch (error) {
          console.error('Error in load for preload module:', error)
          return ''
        }
      }
      
      if (id === resolvedVirtualTypesModuleId) {
        try {
          // 重新扫描API函数以确保最新
          await scanAPIFunctions()
          // 生成类型定义
          const typeDefinitions = generateTypeDefinitions()
          // 写入类型定义文件
          await writeTypeDefinitions(typeDefinitions)
          return typeDefinitions
        } catch (error) {
          console.error('Error in load for types module:', error)
          return ''
        }
      }
    }
  }
}