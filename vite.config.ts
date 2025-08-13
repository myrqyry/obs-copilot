import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'ignore-middleware-in-client',
      resolveId(source) {
        // Ignore any client import referencing middleware
        if (
          source.includes('/src/middleware') ||
          source.includes('src/middleware') ||
          source.startsWith('./src/middleware') ||
          source.startsWith('../src/middleware')
        ) {
          return 'virtual:ignore-middleware';
        }
        return null;
      },
      load(id) {
        if (id === 'virtual:ignore-middleware') {
          return 'export default {};';
        }
        return null;
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5173
  },
  build: {
    rollupOptions: {
      // Exclude the middleware directory from the client bundle
      external: [/^src\/middleware\/.*$/]
    }
  }
});
