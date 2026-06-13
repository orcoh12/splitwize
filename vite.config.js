import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ command }) => ({
  // GitHub Pages serves the site under /splitwize/. Local dev stays at root.
  base: command === 'build' ? '/splitwize/' : '/',
  plugins: [react(), tailwindcss()],
}))
