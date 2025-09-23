import type { Node, NodePath } from '@babel/traverse'
import type { File } from '@babel/types'
import type { Plugin } from 'vite'
import { readFile, writeFile } from 'node:fs/promises'
import * as fs from 'node:fs/promises'
import path, { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import generate from '@babel/generator'
import { parse } from '@babel/parser'
import * as t from '@babel/types'
import fg from 'fast-glob'
import MagicString from 'magic-string'

interface IPCFunction {
  name: string
  fileName: string
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
  // 生成的主进程注册文件路径
  mainRegistryFile?: string
  // 生成的preload客户端文件路径
  preloadClientFile?: string
  // 类型定义文件输出路径（仅preload进程需要）
  typeDefinitionFile?: string
}

// 已移除InterfaceDefinition接口，使用简单的typeof import("module").Type方式处理类型定义

export default function electronIPCPlugin(options: IPCPluginOptions = {}): Plugin {
  const apiFunctions: IPCFunction[] = []
  // 已移除interfaceDefinitions，使用简单的占位符方式处理类型定义
  const __dirname = fileURLToPath(new URL('.', import.meta.url))

  // 默认配置
  const defaultOptions: Required<IPCPluginOptions> = {
    scanDir: process.env.IPC_SCAN_DIR || '../main/src/ipc',
    filePattern: '**/*.ts',
    ignorePattern: ['**/node_modules/**', '**/dist/**'],
    excludeFunctions: [],
    mainRegistryFile: process.env.IPC_MAIN_REGISTRY_FILE || '../main/src/generated/ipc-registry.ts',
    preloadClientFile: process.env.IPC_PRELOAD_CLIENT_FILE || '../preload/src/generated/ipc-client.ts',
    typeDefinitionFile: process.env.IPC_TYPE_DEFINITION_FILE || '../renderer/src/ipc-types.d.ts',
  }

  // 合并配置
  const config = { ...defaultOptions, ...options }

  // 确保路径是绝对路径
  const resolvePath = (relativePath: string) => resolve(process.cwd(), relativePath);

  // 定义插件内部方法
  const scanAPIFunctions = async () => {
    try {
      // 使用配置中的scanDir作为绝对路径或相对于当前工作目录的路径
      const scanPath = resolve(process.cwd(), config.scanDir)
      console.log(`Scanning for IPC functions in: ${scanPath}`)

      // 使用fast-glob扫描所有.ts文件
      const files = await fg(config.filePattern, {
        cwd: scanPath,
        absolute: true,
        ignore: config.ignorePattern,
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
    }
    catch (error) {
      console.error('Error scanning API functions:', error)
    }
  }

  const analyzeFile = async (filePath: string, apiFunctions: IPCFunction[]) => {
    try {
      const content = await readFile(filePath, 'utf-8')

      // 获取文件名（不包含扩展名）
      const fileName = filePath.split('/').pop()?.replace('.ts', '') || ''

      // 使用@babel/parser解析AST
      const ast = parse(content, {
        sourceType: 'module',
        plugins: ['typescript'],
      }) as any

      // 动态导入并使用@babel/traverse遍历AST
      let _traverse: any
      try {
        const module = await import('@babel/traverse')
        _traverse = module.default
      }
      catch (importError) {
        console.error('Failed to import @babel/traverse:', importError)
        return
      }

      if (!_traverse) {
        console.error('@babel/traverse is not available')
        return
      }

      // 检查generate的类型并正确调用
      const generateCode = (node: any) => {
        // 添加对node的检查
        if (!node) {
          throw new Error('Node is null or undefined')
        }

        // 添加对node的额外检查
        if (typeof node !== 'object') {
          throw new TypeError('Node is not an object')
        }

        if (typeof generate === 'function') {
          const result = generate(node)
          return result.code
        }
        else if (typeof (generate as any).default === 'function') {
          const result = (generate as any).default(node)
          return result.code
        }
        else {
          console.error('Unknown generate type:', typeof generate)
          return ''
        }
      }

      // 检查_traverse的类型并正确调用
      const traverseAST = (ast: any, visitor: any) => {
        if (typeof _traverse === 'object' && typeof _traverse.default === 'function') {
          _traverse.default(ast, visitor)
        }
        else if (typeof _traverse === 'function') {
          _traverse(ast, visitor)
        }
        else {
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
                }
                catch (generateError: any) {
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
                }
                catch (generateError: any) {
                  console.warn(`Failed to generate return type for ${functionName}, using 'any':`, generateError.message)
                  returnTypeStr = 'any'
                }
              }

              apiFunctions.push({
                name: functionName,
                fileName,
                filePath,
                exportName: functionName,
                parameters: paramStr,
                returnType: returnTypeStr,
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
                }
                catch (generateError: any) {
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
                }
                catch (generateError: any) {
                  console.warn(`Failed to generate return type for ${functionName}, using 'any':`, generateError.message)
                  returnTypeStr = 'any'
                }
              }

              apiFunctions.push({
                name: functionName,
                fileName,
                filePath,
                exportName: functionName,
                parameters: paramStr,
                returnType: returnTypeStr,
              })
            }
          }
        },
      })
    }
    catch (error) {
      console.error(`Error analyzing file ${filePath}:`, error)
    }
  }

  // 已移除analyzeInterfaceFile函数，使用简单的typeof import("module").Type方式处理类型定义

  const generateMainRegistrationCode = (): string => {
    try {
      // 使用magic-string生成代码
      const s = new MagicString('')

      // 过滤函数：排除excludeFunctions中的函数
      const filteredFunctions = apiFunctions.filter(fn => !config.excludeFunctions.includes(fn.exportName))

      // 按文件名分组函数
      const groupedFunctions: Record<string, IPCFunction[]> = {}
      filteredFunctions.forEach((fn) => {
        if (!groupedFunctions[fn.fileName]) {
          groupedFunctions[fn.fileName] = []
        }
        groupedFunctions[fn.fileName].push(fn)
      })

      // 生成导入语句
      const imports = filteredFunctions.map(fn =>
        `import { ${fn.exportName} } from '${fn.filePath}';`,
      ).join('\n')

      // 生成注册语句
      const registrations = filteredFunctions.map(fn =>
        `ipcMain.handle('${fn.fileName}:${fn.name}', (_, ...args) => ${fn.exportName}(...args));`,
      ).join('\n')

      s.append(`
${imports}
import { ipcMain } from 'electron';

export function registerIPCFunctions() {
  ${registrations}
}
`)

      return s.toString()
    }
    catch (error) {
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

      // 按文件名分组函数
      const groupedFunctions: Record<string, IPCFunction[]> = {}
      filteredFunctions.forEach((fn) => {
        if (!groupedFunctions[fn.fileName]) {
          groupedFunctions[fn.fileName] = []
        }
        groupedFunctions[fn.fileName].push(fn)
      })

      // 生成按文件名分组的对象
      const fileGroups = Object.keys(groupedFunctions).map((fileName) => {
        const fns = groupedFunctions[fileName]
        const functions = fns.map(fn =>
          `${fn.name}: (...args: any[]) => ipcRenderer.invoke('${fn.fileName}:${fn.name}', ...args)`
        ).join(',\n    ')
        return `  ${fileName}: {\n    ${functions}\n  }`
      }).join(',\n')

      // 生成兼容对象（使用函数名作为通道名，为了向后兼容）
      const compatFunctions = filteredFunctions.map(fn =>
        `${fn.name}: (...args) => ipcRenderer.invoke('${fn.name}', ...args)`,
      ).join(',\n  ')

      s.append(`
import { ipcRenderer, contextBridge } from 'electron'

// 按文件名分组的API对象
export const electronAPI = {
${fileGroups}
};

export function exposeIPCFunctions() {
  contextBridge.exposeInMainWorld('ElectronAPI', electronAPI);
}
`)
      console.log(s.toString())
      return s.toString()
    }
    catch (error) {
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

      // 按文件名分组函数
      const groupedFunctions: Record<string, IPCFunction[]> = {}
      filteredFunctions.forEach((fn) => {
        if (!groupedFunctions[fn.fileName]) {
          groupedFunctions[fn.fileName] = []
        }
        groupedFunctions[fn.fileName].push(fn)
      })

      // 生成接口定义
      const interfaceDefinitions = Object.keys(groupedFunctions).map((fileName) => {
        const functions = groupedFunctions[fileName].map((fn) => {
          // 计算相对于typeDefinitionFile的路径
          const relativePath = path.relative(path.dirname(config.typeDefinitionFile || ''), fn.filePath).replace(/\\/g, '/')
          return `    ${fn.name}: typeof import('${relativePath}').${fn.exportName};`
        }).join('\n')
        return `  ${fileName}: {\n${functions}\n  };`
      }).join('\n')

      s.append(`\nexport interface ElectronAPI {\n${interfaceDefinitions}\n}\n\ndeclare global {\n  interface Window {\n    ElectronAPI: ElectronAPI;\n  }\n}\n`)

      return s.toString()
    }
    catch (error) {
      console.error('Error generating type definitions:', error)
      return ''
    }
  }

  const writeTypeDefinitions = async (typeDefinitions: string) => {
    try {
      // 只有当配置了typeDefinitionFile时才写入文件
      if (config.typeDefinitionFile) {
        const typeDefPath = resolvePath(config.typeDefinitionFile)
        // 确保目录存在
        const dir = path.dirname(typeDefPath)
        try {
          await fs.mkdir(dir, { recursive: true })
        } catch (error) {
          // 目录可能已存在
        }
        await writeFile(typeDefPath, typeDefinitions)
        console.log(`Type definitions written to ${typeDefPath}`)
      }
    }
    catch (error) {
      console.error('Error writing type definitions:', error)
    }
  }

  const writeMainRegistryFile = async (code: string) => {
    try {
      if (config.mainRegistryFile) {
        const mainRegistryPath = resolvePath(config.mainRegistryFile)
        // 确保目录存在
        const dir = path.dirname(mainRegistryPath)
        try {
          await fs.mkdir(dir, { recursive: true })
        } catch (error) {
          // 目录可能已存在
        }
        await writeFile(mainRegistryPath, code)
        console.log(`Main registry file written to ${mainRegistryPath}`)
      }
    }
    catch (error) {
      console.error('Error writing main registry file:', error)
    }
  }

  const writePreloadClientFile = async (code: string) => {
    try {
      if (config.preloadClientFile) {
        const preloadClientPath = resolvePath(config.preloadClientFile)
        // 确保目录存在
        const dir = path.dirname(preloadClientPath)
        try {
          await fs.mkdir(dir, { recursive: true })
        } catch (error) {
          // 目录可能已存在
        }
        await writeFile(preloadClientPath, code)
        console.log(`Preload client file written to ${preloadClientPath}`)
      }
    }
    catch (error) {
      console.error('Error writing preload client file:', error)
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
      }
      catch (error) {
        console.error('Error in configResolved:', error)
      }
    },

    async buildStart() {
      try {
        // 扫描API函数
        await scanAPIFunctions()
        
        // 生成并写入主进程注册文件
        const mainRegistrationCode = generateMainRegistrationCode()
        await writeMainRegistryFile(mainRegistrationCode)
        
        // 生成并写入preload客户端文件
        const preloadClientCode = generatePreloadClientCode()
        await writePreloadClientFile(preloadClientCode)
        
        // 生成并写入类型定义文件
        const typeDefinitions = generateTypeDefinitions()
        await writeTypeDefinitions(typeDefinitions)
      }
      catch (error) {
        console.error('Error in buildStart:', error)
      }
    },
  }
}
