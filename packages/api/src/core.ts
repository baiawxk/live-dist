import type { z } from 'zod'

type Implementation<T extends z.ZodFunction> = Parameters<T['implementAsync']>[0]
type Implementations<T extends Record<string, z.ZodFunction>> = {
  [K in keyof T]: Implementation<T[K]>
}

function setupDefaultHandler(ipcMain: any, channelName: string, handler: (...args: any[]) => any) {
  ipcMain.handle(channelName, async (event: any, ...args: any[]) => {
    try {
      const result = await handler(...args)
      return result
    }
    catch (error) {
      console.error(`Error in IPC handler for ${channelName}:`, error)
      throw error
    }
  })
}

export function createApiSchema<T extends Record<string, z.ZodFunction>>(schemas: T, options: { channelPrefix: string }) {
  function createIpcSetupFn(implementations: Implementations<T>) {
    return (ipcMain: any) => {
      for (const [key] of Object.entries(schemas)) {
        const implementation = implementations[key]
        if (!implementation) {
          console.warn(`No implementation found for ${key}`)
          continue
        }
        const channelName = `${options.channelPrefix}:${key}`
        setupDefaultHandler(ipcMain, channelName, implementation)
      }
    }
  }

  function createIPCClient(ipcRenderer: any): Implementations<T> {
    return Object.fromEntries(
      Object.entries(schemas).map(([key]) => {
        const channelName = `${options.channelPrefix}:${key}`
        return [key, async (...args: any[]) => {
          try {
            return await ipcRenderer.invoke(channelName, ...args)
          }
          catch (error) {
            console.error(`Error in IPC client ${channelName}:`, error)
            throw error
          }
        }]
      }),
    ) as any as Implementations<T>
  }

  return {
    schemas,
    createIpcSetupFn,
    createIPCClient,
  }
}
