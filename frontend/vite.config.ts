import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (
            id.includes('recharts') ||
            id.includes('d3-') ||
            id.includes('internmap') ||
            id.includes('decimal.js')
          ) {
            return 'charts'
          }
          if (id.includes('@radix-ui')) return 'radix'
          return 'vendor'
        },
      },
    },
  },
})
