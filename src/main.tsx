import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { gsap } from 'gsap';

// Asynchronously import and register the plugin
(async () => {
  try {
    const { MorphSVGPlugin } = await import('gsap/MorphSVGPlugin');
    gsap.registerPlugin(MorphSVGPlugin);
  } catch (error) {
    console.warn(
      'GSAP MorphSVGPlugin not found. Morphing animations will be disabled. This is a premium plugin from GreenSock Club.',
    );
    // Set a global flag or context to disable morphing components
    (window as any).gsapMorphPluginMissing = true;
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
})();
