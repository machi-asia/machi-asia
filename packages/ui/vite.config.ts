import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'use-client-directive',
      renderChunk(code) {
        if (code.startsWith('"use client"') || code.startsWith("'use client'")) return null
        return { code: `"use client";\n${code}`, map: null }
      },
    },
  ],
  build: {
    minify: false,
    sourcemap: true,
    lib: {
      entry: fileURLToPath(new URL('./src/lib/index.ts', import.meta.url)),
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
    rollupOptions: {
      external: [/^react($|\/)/, /^react-dom($|\/)/],
      output: {
        assetFileNames: 'style.[ext]',
      },
    },
  },
})
