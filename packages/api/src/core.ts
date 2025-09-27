import type { z } from 'zod'

type Implementation<T extends z.ZodFunction> = Parameters<T['implementAsync']>[0]
type Implementations<T extends Record<string, z.ZodFunction>> = {
  [K in keyof T]: Implementation<T[K]>
}

function setupDefaultHandler(ipcMain: any, channelName: string, handler: (...any: any[]) => any, schema: z.ZodFunction) {
  const safeHandler = schema.implementAsync(async (...args: any[]) => {
    return await handler(...args)
  })
  ipcMain.handle(channelName, async (_event: any, ...args: any[]) => {
    console.log(`[Req][${channelName}][${args}]`)
    const result = await safeHandler(...args)
    console.log(`[Res][${channelName}][${args}][${result}]`)
    return result
  })
}

export function createApiSchema<T extends Record<string, z.ZodFunction>>(schemas: T, options: { channelPrefix: string }) {
  function createIpcSetupFn(implementations: Implementations<T>) {
    return (ipcMain: any) => {
      for (const [key, schema] of Object.entries(schemas)) {
        const implementation = implementations[key]
        if (!implementation) {
          console.warn(`No implementation found for ${key}`)
          continue
        }
        const channelName = `${options.channelPrefix}:${key}`
        setupDefaultHandler(ipcMain, channelName, implementation, schema as any)
      }
    }
  }

  function createIPCClient(ipcRenderer: any): Implementations<T> {
    return Object.fromEntries(
      Object.entries(schemas).map(([key, schema]) => {
        const channelName = `${options.channelPrefix}:${key}`
        const safeHandler = schema.implementAsync(async (...args: any[]) => {
          return await ipcRenderer.invoke(channelName, ...args)
        })
        return [key, async (...args: any[]) => {
          console.log(`[Req][${channelName}][${args}]`)
          const result = await safeHandler(...args)
          console.log(`[Res][${channelName}][${args}][${result}]`)
          return result
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
