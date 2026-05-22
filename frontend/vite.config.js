import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname)

// Em GitHub Pages o app fica em https://<user>.github.io/<repo>/
// VITE_BASE permite controlar via env (default: '/' para dev local).
const base = process.env.VITE_BASE || '/'

export default defineConfig({
  root: rootDir,
  envDir: rootDir,
  base,
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
      }
    }
  }
})
