import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { gsap } from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import { onCLS, onINP, onLCP } from 'web-vitals';

// Register GSAP plugins globally
try {
  gsap.registerPlugin(MorphSVGPlugin);
} catch (error) {
  console.warn('GSAP plugin registration failed:', error);
}

// Monitor Core Web Vitals
onCLS(console.log);
onINP(console.log);
onLCP(console.log);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
