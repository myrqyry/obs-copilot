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
      { find: 'utils', replacement: fileURLToPath(new URL('./src/utils', import.meta.url)) },
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
  },
  preview: {
    port: 4173,
  },
});