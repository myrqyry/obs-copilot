import { gsap } from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';

// Test script to verify GSAP is working correctly
export const testGSAP = () => {
    console.log('🎬 Testing GSAP Setup...');

    // Test basic GSAP functionality
    try {
        console.log('✅ GSAP core imported successfully');
        console.log('📊 GSAP version:', gsap.version);

        // Test MorphSVG plugin
        gsap.registerPlugin(MorphSVGPlugin);
        console.log('✅ MorphSVG plugin registered successfully');

        // Test timeline creation
        const testTimeline = gsap.timeline();
        console.log('✅ Timeline creation successful');

        testTimeline.kill(); // Clean up

        console.log('🎉 GSAP setup is working correctly!');
        return true;

    } catch (error) {
        console.error('❌ GSAP setup error:', error);
        return false;
    }
};

// Auto-run test in development
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    testGSAP();
}
