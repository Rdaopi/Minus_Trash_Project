import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        // Keep the /api prefix in the path
        // rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/nominatim': {
        target: 'https://nominatim.openstreetmap.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/nominatim/, ''),
        secure: true,
        headers: {
          'User-Agent': 'MinusTrash-App/1.0 (development)'
        }
      }
    },
  }
}) 