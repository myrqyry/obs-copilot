import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppRouter } from './routes';
import './index.css';
import { gsap } from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Register GSAP plugins globally
try {
  gsap.registerPlugin(MorphSVGPlugin);
} catch (error) {
  console.warn('GSAP plugin registration failed:', error);
}

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppRouter />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>,
);
