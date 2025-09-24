// @ts-check
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    ssr: true,
    sourcemap: 'inline',
    outDir: 'dist',
    assetsDir: '.',
    lib: {
      entry: ['src/index.ts'],
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
    emptyOutDir: true,
    reportCompressedSize: false,
  },
})
