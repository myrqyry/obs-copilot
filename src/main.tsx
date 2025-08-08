import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { gsap } from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin'; // Import the plugin

// Register the plugin with GSAP
if (MorphSVGPlugin) {
  try {
    gsap.registerPlugin(MorphSVGPlugin);
  } catch (error) {
    console.warn('Could not register GSAP MorphSVGPlugin. Morphing animations will be disabled.');
  }
} else {
    console.warn('GSAP MorphSVGPlugin not found. Please ensure you have a valid Club GreenSock membership and the plugin is installed correctly. Morphing animations will be disabled.');
}


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
