import { gsap } from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';

// Register GSAP plugins
gsap.registerPlugin(MorphSVGPlugin);

// Animation configuration constants
export const ANIMATION_CONFIG = {
    // Duration settings
    FAST: 0.3,
    NORMAL: 0.6,
    SLOW: 1.2,
    VERY_SLOW: 2.4,

    // Easing presets
    EASE_SMOOTH: 'power2.inOut',
    EASE_BOUNCE: 'back.out(1.7)',
    EASE_ELASTIC: 'elastic.out(1, 0.3)',
    EASE_QUICK: 'power3.out',

    // Default delays
    SHORT_DELAY: 0.2,
    MEDIUM_DELAY: 0.5,
    LONG_DELAY: 1.0,
} as const;

// Logo animation utilities
export const logoAnimations = {
    /**
     * Pulse animation for logos
     */
    pulse: (element: HTMLElement | SVGElement, options?: {
        scale?: number;
        duration?: number;
        repeat?: number;
    }) => {
        const { scale = 1.05, duration = 3, repeat = -1 } = options || {};

        return gsap.to(element, {
            scale,
            duration: duration / 2,
            ease: ANIMATION_CONFIG.EASE_SMOOTH,
            yoyo: true,
            repeat,
            transformOrigin: 'center center'
        });
    },

    /**
     * Rotation animation for logos
     */
    rotate: (element: HTMLElement | SVGElement, options?: {
        duration?: number;
        repeat?: number;
        direction?: 'clockwise' | 'counterclockwise';
    }) => {
        const { duration = 12, repeat = -1, direction = 'clockwise' } = options || {};
        const rotation = direction === 'clockwise' ? 360 : -360;

        return gsap.to(element, {
            rotation,
            duration,
            ease: 'none',
            repeat,
            transformOrigin: 'center center'
        });
    },

    /**
     * Combined sparkle pulse and rotation for Gemini logo
     */
    geminiSparkle: (element: HTMLElement | SVGElement) => {
        const tl = gsap.timeline({ repeat: -1 });

        // Sparkle pulse
        tl.to(element, {
            scale: 1.15,
            opacity: 1,
            duration: 1.25,
            ease: ANIMATION_CONFIG.EASE_SMOOTH,
            yoyo: true,
            repeat: 1,
            transformOrigin: 'center center'
        });

        // Continuous rotation
        gsap.to(element, {
            rotation: 360,
            duration: 12,
            ease: 'none',
            repeat: -1,
            transformOrigin: 'center center'
        });

        return tl;
    },

    /**
     * Fade in animation with scale
     */
    fadeInScale: (element: HTMLElement | SVGElement, options?: {
        delay?: number;
        duration?: number;
        scale?: number;
    }) => {
        const { delay = 0, duration = ANIMATION_CONFIG.NORMAL, scale = 1 } = options || {};

        gsap.set(element, { opacity: 0, scale: 0.8 });

        return gsap.to(element, {
            opacity: 1,
            scale,
            duration,
            delay,
            ease: ANIMATION_CONFIG.EASE_BOUNCE,
            transformOrigin: 'center center'
        });
    }
};

// UI element animations
export const uiAnimations = {
    /**
     * Modal appearance animation
     */
    modalAppear: (element: HTMLElement, options?: {
        delay?: number;
        duration?: number;
    }) => {
        const { delay = 0, duration = ANIMATION_CONFIG.FAST } = options || {};

        gsap.set(element, { opacity: 0, scale: 0.95 });

        return gsap.to(element, {
            opacity: 1,
            scale: 1,
            duration,
            delay,
            ease: ANIMATION_CONFIG.EASE_BOUNCE,
            transformOrigin: 'center center'
        });
    },

    /**
     * Button hover animation
     */
    buttonHover: (element: HTMLElement) => {
        const tl = gsap.timeline({ paused: true });

        tl.to(element, {
            scale: 1.05,
            duration: ANIMATION_CONFIG.FAST,
            ease: ANIMATION_CONFIG.EASE_QUICK,
            transformOrigin: 'center center'
        });

        return tl;
    },

    /**
     * Loading dots animation
     */
    loadingDots: (dots: HTMLElement[]) => {
        const tl = gsap.timeline({ repeat: -1 });

        dots.forEach((dot, index) => {
            tl.to(dot, {
                scale: 1.2,
                opacity: 1,
                duration: 0.4,
                ease: ANIMATION_CONFIG.EASE_SMOOTH,
                transformOrigin: 'center center'
            }, index * 0.15)
                .to(dot, {
                    scale: 1,
                    opacity: 0.3,
                    duration: 0.4,
                    ease: ANIMATION_CONFIG.EASE_SMOOTH,
                    transformOrigin: 'center center'
                }, index * 0.15 + 0.4);
        });

        return tl;
    },

    /**
     * Tab content transition animation
     */
    tabContentTransition: (element: HTMLElement, options?: {
        direction?: 'left' | 'right' | 'up' | 'down';
        duration?: number;
        delay?: number;
    }) => {
        const {
            direction = 'up',
            duration = ANIMATION_CONFIG.FAST,
            delay = 0
        } = options || {};

        let fromVars: gsap.TweenVars = { opacity: 0 };
        let toVars: gsap.TweenVars = { opacity: 1 };

        switch (direction) {
            case 'left':
                fromVars.x = -15;
                toVars.x = 0;
                break;
            case 'right':
                fromVars.x = 15;
                toVars.x = 0;
                break;
            case 'down':
                fromVars.y = -10;
                toVars.y = 0;
                break;
            case 'up':
            default:
                fromVars.y = 10;
                toVars.y = 0;
                break;
        }

        gsap.set(element, fromVars);

        return gsap.to(element, {
            ...toVars,
            duration,
            delay,
            ease: ANIMATION_CONFIG.EASE_QUICK
        });
    },

    /**
     * Staggered children animation
     */
    staggerChildren: (parent: HTMLElement, options?: {
        stagger?: number;
        duration?: number;
        from?: 'start' | 'center' | 'end';
    }) => {
        const {
            stagger = 0.1,
            duration = ANIMATION_CONFIG.FAST,
            from = 'start'
        } = options || {};

        const children = Array.from(parent.children) as HTMLElement[];

        gsap.set(children, { opacity: 0, y: 20 });

        return gsap.to(children, {
            opacity: 1,
            y: 0,
            duration,
            stagger: {
                amount: stagger * children.length,
                from
            },
            ease: ANIMATION_CONFIG.EASE_BOUNCE
        });
    }
};

// Utility functions
export const gsapUtils = {
    /**
     * Kill all animations on an element
     */
    killAnimations: (element: HTMLElement | SVGElement | string) => {
        gsap.killTweensOf(element);
    },

    /**
     * Set element to be GSAP-ready (prevents FOUC)
     */
    setReady: (element: HTMLElement | SVGElement) => {
        gsap.set(element, { opacity: 1 });
        element.classList.add('gsap-ready');
    },

    /**
     * Initialize element for GSAP animations
     */
    initElement: (element: HTMLElement | SVGElement) => {
        element.classList.add('gsap-logo');
        gsap.set(element, {
            transformOrigin: 'center center',
            willChange: 'transform, opacity'
        });
    },

    /**
     * Create a master timeline for coordinated animations
     */
    createMasterTimeline: (options?: gsap.TimelineVars) => {
        return gsap.timeline(options);
    }
};

// Export default GSAP instance with plugins registered
export { gsap };
export default gsap;
