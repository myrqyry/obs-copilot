
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

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
      'process.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
      'process.env.VITE_GIPHY_API_KEY': JSON.stringify(env.VITE_GIPHY_API_KEY),
      // You can define other environment variables here if needed
      // 'process.env.NODE_ENV': JSON.stringify(mode),
    },
    server: {
      port: 5173, // Use Vite's default port for consistency
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
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
      force: true
    },
    resolve: {
      alias: {
        // Remove problematic GSAP alias that was causing warnings
      }
    }
  };
});