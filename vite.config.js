import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: true, // listen on 0.0.0.0
    allowedHosts: ['.localhost', 'localhost'], // allow any *.localhost
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      external: ['express', 'cors', 'dotenv', 'fs', 'path', 'jsonwebtoken', 'multer', 'pg'],
    },
  },
})
