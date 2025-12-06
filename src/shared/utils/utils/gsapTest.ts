// GSAP Test utility for development verification
import { gsap } from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';

// Simple test to verify GSAP and MorphSVG plugin are working
const testGSAP = () => {
  if (typeof window === 'undefined') return;
  
  try {
    // Test basic GSAP functionality
    const testDiv = document.createElement('div');
    gsap.set(testDiv, { opacity: 0 });
    
    // Test MorphSVG plugin if available
    if (MorphSVGPlugin) {
      console.log('✅ GSAP MorphSVG plugin loaded successfully');
    } else {
      console.warn('⚠️ GSAP MorphSVG plugin not available');
    }
    
    console.log('✅ GSAP core functionality verified');
  } catch (error) {
    console.error('❌ GSAP test failed:', error);
  }
};

// Run test in development mode
if (import.meta.env.DEV) {
  testGSAP();
}

export { testGSAP };