import { defineConfig } from 'vitest/config'

export default defineConfig(
  {
    test: {
      projects: [
        { test: { name: 'api', root: './packages/api', environment: 'node' } },
        { test: { name: 'main', root: './packages/main', environment: 'node' } },
        { test: { name: 'preload', root: './packages/preload', environment: 'node' } },
        { test: { name: 'renderer', root: './packages/renderer', environment: 'jsdom' } },
      ],
    },
  },
)
