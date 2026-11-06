/// <reference types="vitest/config" />
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  server: {
    // /data/bases lives outside the Vite root; allow the dev server to read it.
    fs: { allow: [path.resolve(import.meta.dirname, '..')] },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
