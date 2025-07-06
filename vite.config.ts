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
      // Expose environment variables to your client-side code
      // IMPORTANT: Ensure API_KEY is set in your build environment (e.g., Netlify settings)
      // For local development, you can use a .env.local file (e.g., VITE_GEMINI_API_KEY=your_actual_key_here)
      'process.env.API_KEY': JSON.stringify(env.API_KEY),

      // Core API Keys
      'process.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
      'process.env.VITE_GIPHY_API_KEY': JSON.stringify(env.VITE_GIPHY_API_KEY),
      'process.env.VITE_TENOR_API_KEY': JSON.stringify(env.VITE_TENOR_API_KEY),
      'process.env.VITE_ICONFINDER_API_KEY': JSON.stringify(env.VITE_ICONFINDER_API_KEY),

      // Image and Photo APIs
      'process.env.VITE_UNSPLASH_API_KEY': JSON.stringify(env.VITE_UNSPLASH_API_KEY),
      'process.env.VITE_PEXELS_API_KEY': JSON.stringify(env.VITE_PEXELS_API_KEY),
      'process.env.VITE_PIXABAY_API_KEY': JSON.stringify(env.VITE_PIXABAY_API_KEY),
      'process.env.VITE_DEVIANTART_API_KEY': JSON.stringify(env.VITE_DEVIANTART_API_KEY),

      // GIF and Media APIs
      'process.env.VITE_IMGFLIP_API_KEY': JSON.stringify(env.VITE_IMGFLIP_API_KEY),
      'process.env.VITE_IMGUR_API_KEY': JSON.stringify(env.VITE_IMGUR_API_KEY),
      'process.env.VITE_CHUTES_API_TOKEN': JSON.stringify(env.VITE_CHUTES_API_TOKEN),

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
        // Proxy for backgrounds APIs
        '/api/pexels': {
          target: 'https://api.pexels.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/pexels/, '/v1/search'),
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              // Extract key from query params and set as Authorization header
              const url = new URL(req.url || '', 'http://localhost');
              const key = url.searchParams.get('key');
              if (key) {
                proxyReq.setHeader('Authorization', key);
                proxyReq.setHeader('User-Agent', 'OBS-Copilot/1.0');
              }
            });
          }
        },
        '/api/pixabay': {
          target: 'https://pixabay.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/pixabay/, '/api/'),
        },
        '/api/artstation': {
          target: 'https://www.artstation.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/artstation/, '/search/projects.json'),
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              proxyReq.setHeader('User-Agent', 'OBS-Copilot/1.0');
            });
          }
        },
        '/api/deviantart': {
          target: 'https://www.deviantart.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/deviantart/, '/api/v1/oauth2/browse/search'),
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              // Extract key from query params and set as access_token
              const url = new URL(req.url || '', 'http://localhost');
              const key = url.searchParams.get('key');
              if (key) {
                url.searchParams.set('access_token', key);
                url.searchParams.delete('key');
                proxyReq.path = url.pathname + url.search;
              }
            });
          }
        },
        // Keep existing wallhaven proxy
        '/api/wallhaven': {
          target: 'https://wallhaven.cc',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/wallhaven/, '/api/v1/search'),
        },
        // General API proxy for other endpoints
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
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
