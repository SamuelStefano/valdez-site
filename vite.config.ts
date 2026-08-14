import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages serve em /valdez-site/, Vercel serve na raiz. O base vem do
// ambiente pra o mesmo build servir os dois sem editar arquivo.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), tailwindcss()],
})
