import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '../'), '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: env.VITE_ADMIN_API_URL || 'http://localhost:3000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
        '/image': {
          target: env.VITE_ADMIN_API_URL || 'http://localhost:3000',
          changeOrigin: true,
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.log('Image proxy error:', err.message);
              // Fallback: serve a 404 or redirect to original URL
              res.writeHead(404, { 'Content-Type': 'text/plain' });
              res.end('Image proxy unavailable');
            });
          },
        },
        '/obs': {
          target: env.VITE_OBS_WEBSOCKET_URL || 'ws://localhost:4455',
          ws: true,
        },
      },
    },
  };
});
