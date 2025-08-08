import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode (development, production)
  // and the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    server: {
      port: 5173, // Use Vite's default port for consistency
      // proxy: {
      //   // All API requests should go to the local proxy server
      //   '/api': {
      //     target: 'http://localhost:3001', // This should match the port your proxy.cjs runs on
      //     changeOrigin: true,
      //     secure: false, // Set to true if your proxy server uses HTTPS, but for local dev 'false' is common
      //     // No rewrite needed if proxy.cjs expects paths like /api/gemini, /api/wallhaven etc.
      //     // Rewrite /api/proxy to /api to handle deprecated favicon calls
      //     rewrite: (path) => path.replace(/^\/api\/proxy/, '/api'),
      //   },
      // },
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp'
      },
      // Add a server hook to ensure the proxy is ready before Vite attempts to connect
      async configureServer(server) {
        const { default: proxy } = await import('./src/vite-middleware');
        server.middlewares.use(proxy);
      },
    },
    build: {
      outDir: 'dist', // Optional: specify output directory
      rollupOptions: {
        // Optimize GSAP for production builds
        external: [],
        output: {
          manualChunks: {
            gsap: ['gsap'],
          }
        }
      }
    },
    optimizeDeps: {
      // Ensure GSAP is properly optimized for development
      include: ['gsap'],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    }
  };
});
