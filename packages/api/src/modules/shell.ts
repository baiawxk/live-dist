import { z } from 'zod'
import { createApiSchema } from '../core'

export const shellApi = createApiSchema(
  {
    openInBrowser: z.function({
      input: [z.string()],
      output: z.void(),
    }),
  },
  {
    channelPrefix: 'shell',
  },
)
