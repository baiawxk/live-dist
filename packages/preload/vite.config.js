import { getChromeMajorVersion } from '@app/electron-versions'
import { resolveModuleExportNames } from 'mlly'
import electronIPCPlugin from '@app/vite-plugin-electron-ipc'

export default /**
                * @type {import('vite').UserConfig}
                * @see https://vitejs.dev/config/
                */
({
  build: {
    ssr: true,
    sourcemap: 'inline',
    outDir: 'dist',
    target: `chrome${getChromeMajorVersion()}`,
    assetsDir: '.',
    lib: {
      entry: ['src/exposed.ts', 'virtual:browser.js'],
    },
    rollupOptions: {
      output: [
        {
          // ESM preload scripts must have the .mjs extension
          // https://www.electronjs.org/docs/latest/tutorial/esm#esm-preload-scripts-must-have-the-mjs-extension
          entryFileNames: '[name].mjs',
        },
      ],
    },
    emptyOutDir: true,
    reportCompressedSize: false,
  },
  plugins: [
    mockExposed(), 
    handleHotReload(), 
    electronIPCPlugin({
      // 扫描API函数的目录路径
      scanDir: '/Users/chenhongqiang/workspace/live-dist/packages/main/src/ipc',
      // 排除不需要注册为IPC的函数
      excludeFunctions: [],
      // 类型定义文件输出路径
      typeDefinitionFile: '/Users/chenhongqiang/workspace/live-dist/packages/preload/src/ipc-types.d.ts'
    })
  ],
})

/**
 * This plugin creates a browser (renderer) version of `preload` package.
 * Basically, it just read all nominals you exported from package and define it as globalThis properties
 * expecting that real values were exposed by `electron.contextBridge.exposeInMainWorld()`
 *
 * Example:
 * ```ts
 * // index.ts
 * export const someVar = 'my-value';
 * ```
 *
 * Output
 * ```js
 * // _virtual_browser.mjs
 * export const someVar = globalThis[<hash>] // 'my-value'
 * ```
 */
function mockExposed() {
  const virtualModuleId = 'virtual:browser.js'
  const resolvedVirtualModuleId = `\0${virtualModuleId}`

  return {
    name: 'electron-main-exposer',
    resolveId(id) {
      if (id.endsWith(virtualModuleId)) {
        return resolvedVirtualModuleId
      }
    },
    async load(id) {
      if (id === resolvedVirtualModuleId) {
        const exportedNames = await resolveModuleExportNames('./src/index.ts', {
          url: import.meta.url,
        })
        return exportedNames.reduce((s, key) => {
          return (
            s
            + (key === 'default'
              ? `export default globalThis['${btoa(key)}'];\n`
              : `export const ${key} = globalThis['${btoa(key)}'];\n`)
          )
        }, '')
      }
    },
  }
}

/**
 * Implement Electron webview reload when some file was changed
 * @return {import('vite').Plugin}
 */
function handleHotReload() {
  /** @type {import('vite').ViteDevServer|null} */
  let rendererWatchServer = null

  return {
    name: '@app/preload-process-hot-reload',

    config(config, env) {
      if (env.mode !== 'development') {
        return
      }

      const rendererWatchServerProvider = config.plugins.find(p => p.name === '@app/renderer-watch-server-provider')
      if (!rendererWatchServerProvider) {
        throw new Error('Renderer watch server provider not found')
      }

      rendererWatchServer = rendererWatchServerProvider.api.provideRendererWatchServer()

      return {
        build: {
          watch: {},
        },
      }
    },

    writeBundle() {
      if (!rendererWatchServer) {
        return
      }

      rendererWatchServer.ws.send({
        type: 'full-reload',
      })
    },
  }
}
