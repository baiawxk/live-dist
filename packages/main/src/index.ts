import type { AppInitConfig } from './AppInitConfig.js'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { app } from 'electron'
import { createModuleRunner } from './ModuleRunner.js'
import { terminateAppOnLastWindowClose } from './modules/ApplicationTerminatorOnLastWindowClose.js'
import { autoUpdater } from './modules/AutoUpdater.js'
import { allowInternalOrigins } from './modules/BlockNotAllowdOrigins.js'

import { allowExternalUrls } from './modules/ExternalUrls.js'
import { hardwareAccelerationMode } from './modules/HardwareAccelerationModule.js'
import { createIPCHandlerModule } from './modules/IPCHandlerModule.js'
import { disallowMultipleAppInstance } from './modules/SingleInstanceApp.js'
import { createWindowManagerModule } from './modules/WindowManager.js'

async function initApp(initConfig: AppInitConfig) {
  const moduleRunner = createModuleRunner()
    .init(createWindowManagerModule({ initConfig, openDevTools: false }))
    .init(disallowMultipleAppInstance())
    .init(terminateAppOnLastWindowClose())
    .init(hardwareAccelerationMode({ enable: false }))
    .init(autoUpdater())
    .init(createIPCHandlerModule())

  // Install DevTools extension if needed
  // .init(chromeDevToolsExtension({extension: 'VUEJS3_DEVTOOLS'}))

    // Security
    .init(allowInternalOrigins(
      new Set(initConfig.renderer instanceof URL ? [initConfig.renderer.origin] : []),
    ))
    .init(allowExternalUrls(
      new Set(
        initConfig.renderer instanceof URL
          ? [
              'https://vite.dev',
              'https://developer.mozilla.org',
              'https://solidjs.com',
              'https://qwik.dev',
              'https://lit.dev',
              'https://react.dev',
              'https://preactjs.com',
              'https://www.typescriptlang.org',
              'https://vuejs.org',
            ]
          : [],
      ),
    ),
    )

  await moduleRunner
}

if (process.env.NODE_ENV === 'development' || process.env.PLAYWRIGHT_TEST === 'true' || !!process.env.CI) {
  function showAndExit(...args: any[]) {
    console.error(...args)
    process.exit(1)
  }

  process.on('uncaughtException', showAndExit)
  process.on('unhandledRejection', showAndExit)
}

// noinspection JSIgnoredPromiseFromCall
/**
 * We resolve '@app/renderer' and '@app/preload'
 * here and not in '@app/main'
 * to observe good practices of modular design.
 * This allows fewer dependencies and better separation of concerns in '@app/main'.
 * Thus,
 * the main module remains simplistic and efficient
 * as it receives initialization instructions rather than direct module imports.
 */

initApp(
  {
    renderer: (process.env.MODE === 'development' && !!import.meta.env.VITE_DEV_SERVER_URL)
      ? new URL(import.meta.env.VITE_DEV_SERVER_URL)
      : {
          path: fileURLToPath(import.meta.resolve('@app/renderer')),
        },

    preload: {
      path: fileURLToPath(import.meta.resolve('@app/preload/exposed.mjs')),
    },
  },
)
