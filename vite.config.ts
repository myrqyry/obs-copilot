/// <reference types="vitest/config" />
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
import path from 'node:path';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'buffer': 'buffer/'
    }
  },
  server: {
    port: 5173,
    host: true,
    // bind on all interfaces for LAN testing
    proxy: {
      '/api': {
        // Backend dev helper usually listens on 8000 in this environment.
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      }
    },
    // Ignore Python/backend artifacts and large generated files during frontend dev
    watch: {
      ignored: ['**/backend/**', '**/__pycache__/**', '**/.pytest_cache/**', '**/.mypy_cache/**', '**/*.pyc', '**/*.pyo', '**/node_modules/**', '**/.git/**', '**/build-logs/**', '**/coverage/**', '**/tsc_output*', '**/*.log'],
      usePolling: false,
      interval: 1000
    }
  },
  preview: {
    port: 4173
  },
  optimizeDeps: {},
  define: {
    // Some libraries reference global or globalThis.Buffer; we ensure references don't crash before polyfills load.
    'globalThis.Buffer': 'globalThis.Buffer',
    'process.env': {}
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./jest.setup.js'],
    css: true,
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'backend/**'],
    projects: [{
      extends: true,
      plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
      storybookTest({
        configDir: path.join(dirname, '.storybook')
      })],
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: playwright({}),
          instances: [{
            browser: 'chromium'
          }]
        },
        setupFiles: ['.storybook/vitest.setup.ts']
      }
    }]
  }
});