// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { nodePolyfills } from 'vite-plugin-node-polyfills'; // Import the plugin

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      // Proxy all requests starting with /api to your Python backend.
      // In development the Vite dev server will forward /api to the target below to avoid CORS.
      // By default this points to localhost:8000 (FastAPI local server). To use a different
      // target during dev you can set the environment variable VITE_ADMIN_API_URL before
      // starting the dev server (Vite will replace import.meta.env values at build time).
      // This keeps parity with production where VITE_ADMIN_API_URL should point at your backend.
      '/api': {
        target: process.env.VITE_ADMIN_API_URL || 'http://localhost:8000', // prefer VITE_ADMIN_API_URL if set, otherwise default
        changeOrigin: true,
        // If your backend supports websockets, enable ws: true
        ws: true,
        // secure: false // Uncomment for local HTTPS/self-signed certs if needed
      },
    },
  },

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

  build: {
    rollupOptions: {
      external: [/^src\/middleware\/.*$/]
    }
  }
});