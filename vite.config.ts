// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: true, // bind on all interfaces for LAN testing
    proxy: {
      '/api': {
        // Backend dev helper usually listens on 8000 in this environment.
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
    // Ignore Python/backend artifacts during frontend dev
    watch: {
      ignored: [
        '**/backend/**',
        '**/__pycache__/**',
        '**/.pytest_cache/**',
        '**/.mypy_cache/**',
        '**/*.pyc',
        '**/*.pyo',
      ],
      usePolling: false,
      interval: 1000,
    },
  },
  preview: {
    port: 4173,
  },
  optimizeDeps: {
    include: ['buffer'],
  },
  define: {
    // Some libraries reference global or globalThis.Buffer; we ensure references don't crash before polyfills load.
    'globalThis.Buffer': 'globalThis.Buffer',
    'process.env': {},
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
