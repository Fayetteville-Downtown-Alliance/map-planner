import { defineConfig } from 'vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { resolve } from 'node:path'
export default defineConfig({
  resolve: { alias: { '/src': resolve('apps/web/src') } },
  plugins: [react(), basicSsl({ name: 'map-planner-preview', certDir: '.data/worker-tls' }), cloudflare({ persistState: { path: '.data/worker-state' } })],
  build: { outDir: 'dist/worker-preview', rollupOptions: { input: resolve('apps/web/index.html') } },
  server: { host: '127.0.0.1', port: 8790, strictPort: true },
})
