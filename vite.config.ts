// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      { find: 'components', replacement: fileURLToPath(new URL('./src/components', import.meta.url)) },
      { find: 'features', replacement: fileURLToPath(new URL('./src/features', import.meta.url)) },
      { find: 'hooks', replacement: fileURLToPath(new URL('./src/hooks', import.meta.url)) },
      { find: 'services', replacement: fileURLToPath(new URL('./src/services', import.meta.url)) },
      { find: 'store', replacement: fileURLToPath(new URL('./src/store', import.meta.url)) },
      { find: 'types', replacement: fileURLToPath(new URL('./src/types', import.meta.url)) },
    ],
  },
  server: {
    port: 5173,
    host: true, // bind on all interfaces for LAN testing
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
    // Reduce filesystem watchers by ignoring large or generated folders
    watch: {
      ignored: [
        // Core directories to ignore
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/build/**',
        '**/backend/**',
        '**/tmp/**',
        '**/.cache/**',
        '**/public/**',
        
        // Environment and config files
        '**/.env*',
        '**/*.log',
        
        // Python artifacts
        '**/__pycache__/**',
        '**/.pytest_cache/**',
        '**/.mypy_cache/**',
        '**/.coverage',
        '**/htmlcov/**',
        '**/.tox/**',
        '**/coverage/**',
        '**/*.pyc',
        '**/*.pyo',
        
        // System files
        '**/.DS_Store',
        '**/Thumbs.db',
        '**/*.swp',
        '**/*.swo',
        '**/*~',
        
        // Build and tool directories
        '**/tailwind/**',
        '**/.vscode/**',
        '**/.idea/**',
        '**/.cursor/**',
        
        // Additional aggressive ignores for large projects
        '**/coverage/**',
        '**/docs/**',
        '**/stories/**',
        '**/.storybook/**',
        '**/.next/**',
        '**/.nuxt/**',
        '**/.svelte-kit/**',
        '**/out/**',
        '**/.output/**',
        
        // Test files (if not needed for development)
        '**/*.test.*',
        '**/*.spec.*',
        '**/__tests__/**',
        '**/test/**',
        '**/tests/**',
        
        // Documentation
        '**/*.md',
        '**/README*',
        '**/CHANGELOG*',
        '**/LICENSE*',
        
        // Package manager files
        '**/package-lock.json',
        '**/yarn.lock',
        '**/pnpm-lock.yaml',
        '**/bun.lockb',
        
        // TypeScript build artifacts
        '**/*.d.ts.map',
        '**/*.js.map',
        '**/*.tsbuildinfo',
      ],
      // Use polling instead of native watchers for better reliability
      usePolling: false,
      // Increase the interval to reduce CPU usage
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
  },
});