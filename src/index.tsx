import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { gsap } from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin'; // Import the plugin

// Register the plugin here, once for the entire app.
gsap.registerPlugin(MorphSVGPlugin);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
