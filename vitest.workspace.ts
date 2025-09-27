import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  {
    test: {
      name: 'api',
      root: './packages/api',
      environment: 'node',
    },
  },
  {
    test: {
      name: 'main',
      root: './packages/main',
      environment: 'node',
    },
  },
  {
    test: {
      name: 'preload',
      root: './packages/preload',
      environment: 'node',
    },
  },
  {
    test: {
      name: 'renderer',
      root: './packages/renderer',
      environment: 'jsdom',
    },
  },
])