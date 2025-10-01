import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { mergeConfig } from 'vite'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    plugins: [react()],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./jest.setup.js'], // Reuse existing Jest setup file
      css: true,
      include: ['**/*.{test,spec}.{ts,tsx}'],
      exclude: ['node_modules', 'dist', 'backend/**'],
    },
  })
)
