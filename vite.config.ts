// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { nodePolyfills } from 'vite-plugin-node-polyfills'; // Import the plugin
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills(), // Add the node polyfills plugin
    {
      name: 'ignore-middleware-in-client',
      resolveId(source) {
        if ( // Only ignore middleware files when building for the client
          source.includes('/src/middleware') ||
          source.includes('src/middleware')
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
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000', // Proxy API requests to the Express server
    },
  },
  build: {
    rollupOptions: {
      external: [/^src\/middleware\/.*$/]
    }
  }
});