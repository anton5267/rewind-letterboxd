
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const basePath = process.env.VITE_BASE_PATH || '/'
const publicBase = basePath.endsWith('/') ? basePath : `${basePath}/`

export default defineConfig({
  base: basePath,
  plugins: [react(), {
    name: 'github-pages-public-image-paths',
    generateBundle(_options, bundle) {
      if (publicBase === '/') return
      for (const output of Object.values(bundle)) {
        if (output.type === 'chunk') {
          output.code = output.code.replace(/(["'])\/images\//g, `$1${publicBase}images/`)
        }
      }
    },
  }],
  server: {
    // The API dev CORS allowlist includes 5173 and 5174, not Vite's next free port.
    port: Number(process.env.VITE_DEV_PORT || 5173),
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8081',
        changeOrigin: true,
      },
    },
  },
})
