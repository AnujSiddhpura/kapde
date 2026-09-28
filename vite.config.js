import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { kapdeDbPlugin } from './vite-plugin-db.js'

export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react(), kapdeDbPlugin()],
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
})
