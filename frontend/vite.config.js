import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-404-fallback',
      closeBundle() {
        try {
          const distDir = path.resolve(__dirname, 'dist')
          const indexPath = path.resolve(distDir, 'index.html')
          const fallbackPath = path.resolve(distDir, '404.html')
          if (fs.existsSync(indexPath)) {
            fs.copyFileSync(indexPath, fallbackPath)
          }
        } catch (_) {}
      },
    },
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
