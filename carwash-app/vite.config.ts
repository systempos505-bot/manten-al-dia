import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// base is "/" (default) for the web build, served from the domain root on
// Vercel. The Electron desktop build overrides it to "./" via --base so the
// packaged app can load assets from the local filesystem (see
// package.json's build:electron script).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
  },
})
