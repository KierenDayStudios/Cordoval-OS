import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    build: {
      outDir: 'out/main',
      rollupOptions: {
        external: ['electron', 'electron-updater']
      }
    }
  },
  preload: {
    build: {
      outDir: 'out/preload'
    }
  },
  renderer: {
    build: {
      outDir: 'out/renderer'
    },
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react()]
  }
})
