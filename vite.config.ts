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
    define: {
      // Firebase Configuration
      'process.env.VITE_FIREBASE_API_KEY': JSON.stringify(env.VITE_FIREBASE_API_KEY),
      'process.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(env.VITE_FIREBASE_AUTH_DOMAIN),
      'process.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(env.VITE_FIREBASE_PROJECT_ID),
      'process.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(env.VITE_FIREBASE_STORAGE_BUCKET),
      'process.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(env.VITE_FIREBASE_MESSAGING_SENDER_ID),
      'process.env.VITE_FIREBASE_APP_ID': JSON.stringify(env.VITE_FIREBASE_APP_ID),
      'process.env.VITE_FIREBASE_MEASUREMENT_ID': JSON.stringify(env.VITE_FIREBASE_MEASUREMENT_ID),

      // You can define other environment variables here if needed
      // 'process.env.NODE_ENV': JSON.stringify(mode),
    },
    server: {
      port: 5173, // Use Vite's default port for consistency
      proxy: {
        // All API requests should go to the local proxy server
        '/api': {
          target: 'http://localhost:3001', // This should match the port your proxy.cjs runs on
          changeOrigin: true,
          secure: false, // Set to true if your proxy server uses HTTPS, but for local dev 'false' is common
          // No rewrite needed if proxy.cjs expects paths like /api/gemini, /api/wallhaven etc.
          // If proxy.cjs expects paths without /api prefix, you might need:
          // rewrite: (path) => path.replace(/^\/api/, ''),
          // However, based on proxy.cjs, it expects /api/* paths.
        },
      },
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp'
      }
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
      force: true
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    }
  };
});
