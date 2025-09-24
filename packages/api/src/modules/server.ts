import { z } from 'zod'
import { createApiSchema } from '../core'

export const serverApi = createApiSchema(
  {
    startServer: z.function({
      input: [z.string()],
      output: z.boolean(),
    }),

    stopServer: z.function({
      input: [z.string()],
      output: z.boolean(),
    }),
  },
  {
    channelPrefix: 'server',
  },
)
