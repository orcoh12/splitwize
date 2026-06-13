import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(() => ({
  // GitHub Pages serves under /splitwize/; Vercel and local dev serve at root.
  // The GitHub Actions workflow sets DEPLOY_TARGET=gh-pages.
  base: process.env.DEPLOY_TARGET === 'gh-pages' ? '/splitwize/' : '/',
  plugins: [react(), tailwindcss()],
}))
