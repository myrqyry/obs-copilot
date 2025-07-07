import { gsap } from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';

/* Removed duplicate gsap.registerPlugin(MorphSVGPlugin) as it is already registered in src/index.tsx */

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

// Text Split Animation Utilities
// Creates letter-by-letter animations with GSAP
export const textSplitAnimations = {
    /**
     * Split text into individual letters and wrap them in spans
     */
    splitText: (element: HTMLElement | string): HTMLElement[] => {
        const target = typeof element === 'string' ? document.querySelector(element) : element;
        if (!target) return [];

        const text = target.textContent || '';
        const letters: HTMLElement[] = [];

        // Clear the original content
        target.innerHTML = '';

        // Create individual letter spans
        text.split('').forEach((char, index) => {
            const letter = document.createElement('span');
            letter.className = 'textsplit-letter';
            letter.textContent = char === ' ' ? '\u00A0' : char; // Use non-breaking space
            letter.style.display = 'inline-block';
            letter.style.position = 'relative';
            letter.setAttribute('data-letter-index', index.toString());

            target.appendChild(letter);
            letters.push(letter);
        });

        return letters;
    },

    /**
     * Animate letters flying to the right (toward send button)
     */
    flyToSend: (element: HTMLElement | string, options?: {
        duration?: number;
        stagger?: number;
        ease?: string;
        direction?: 'right' | 'topRight';
        onComplete?: () => void;
    }) => {
        const {
            duration = 0.8,
            stagger = 0.03,
            ease = 'power2.in',
            direction = 'right',
            onComplete
        } = options || {};

        const target = typeof element === 'string' ? document.querySelector(element) as HTMLElement : element;
        if (!target) return null;

        // Split the text first
        const letters = textSplitAnimations.splitText(target);

        if (letters.length === 0) return null;

        // Add sending class
        target.classList.add('textsplit-sending');

        // Calculate animation targets based on direction
        const xTarget = direction === 'topRight' ? '150vw' : '120vw';
        const yTarget = direction === 'topRight' ? '-50vh' : '0vh';

        // Create timeline for the animation
        const tl = gsap.timeline({
            onComplete: () => {
                target.classList.remove('textsplit-sending');
                target.classList.add('textsplit-sent');
                onComplete?.();
            }
        });

        // Animate each letter with stagger
        tl.to(letters, {
            x: xTarget,
            y: yTarget,
            rotation: direction === 'topRight' ? 'random(-180, 180)' : 'random(-45, 45)',
            scale: 'random(0.1, 0.3)',
            opacity: 0,
            duration,
            ease,
            stagger: {
                amount: stagger * letters.length,
                from: 'start'
            }
        });

        return tl;
    },

    /**
     * Reverse animation - letters flying in from the right
     */
    flyFromSend: (element: HTMLElement | string, text: string, options?: {
        duration?: number;
        stagger?: number;
        ease?: string;
        onComplete?: () => void;
    }) => {
        const {
            duration = 0.6,
            stagger = 0.02,
            ease = 'back.out(1.7)',
            onComplete
        } = options || {};

        const target = typeof element === 'string' ? document.querySelector(element) as HTMLElement : element;
        if (!target) return null;

        // Set the text content
        target.textContent = text;

        // Split the text
        const letters = textSplitAnimations.splitText(target);

        if (letters.length === 0) return null;

        // Set initial state (off-screen right)
        gsap.set(letters, {
            x: '100vw',
            scale: 0.2,
            opacity: 0,
            rotation: 45
        });

        // Animate letters flying in
        return gsap.to(letters, {
            x: 0,
            scale: 1,
            opacity: 1,
            rotation: 0,
            duration,
            ease,
            stagger: {
                amount: stagger * letters.length,
                from: 'start'
            },
            onComplete
        });
    },

    /**
     * Reset text split elements to normal state
     */
    resetTextSplit: (element: HTMLElement | string, originalText?: string) => {
        const target = typeof element === 'string' ? document.querySelector(element) as HTMLElement : element;
        if (!target) return;

        // Remove animation classes
        target.classList.remove('textsplit-sending', 'textsplit-sent');

        // Restore original text if provided
        if (originalText) {
            target.textContent = originalText;
        } else {
            // If no original text, try to reconstruct from data attribute
            const original = target.getAttribute('data-original-text');
            if (original) {
                target.textContent = original;
            }
        }

        // Clear any inline styles
        gsap.set(target, { clearProps: 'all' });
    },

    /**
     * Create a typewriter effect with text split
     */
    typewriter: (element: HTMLElement | string, text: string, options?: {
        duration?: number;
        ease?: string;
        onComplete?: () => void;
    }) => {
        const {
            duration = 0.05,
            ease = 'none',
            onComplete
        } = options || {};

        const target = typeof element === 'string' ? document.querySelector(element) as HTMLElement : element;
        if (!target) return null;

        target.textContent = text;
        const letters = textSplitAnimations.splitText(target);

        if (letters.length === 0) return null;

        // Hide all letters initially
        gsap.set(letters, { opacity: 0, scale: 0.8 });

        // Animate each letter appearing
        return gsap.to(letters, {
            opacity: 1,
            scale: 1,
            duration,
            ease,
            stagger: duration,
            onComplete
        });
    }
};

// Export utility for triggering text split from chat input
export const triggerTextSplitOnSend = (
    inputElement: HTMLElement,
    sendButtonElement?: HTMLElement,
    onComplete?: () => void
) => {
    const text = inputElement.textContent || '';
    if (!text.trim()) return null;

    // Determine direction based on send button position
    let direction: 'right' | 'topRight' = 'right';

    if (sendButtonElement) {
        const inputRect = inputElement.getBoundingClientRect();
        const buttonRect = sendButtonElement.getBoundingClientRect();

        // If send button is above and to the right, use topRight direction
        if (buttonRect.top < inputRect.top && buttonRect.left > inputRect.left) {
            direction = 'topRight';
        }
    }

    return textSplitAnimations.flyToSend(inputElement, {
        duration: 0.8,
        stagger: 0.03,
        ease: 'power2.in',
        direction,
        onComplete: () => {
            // Clear the input after animation
            setTimeout(() => {
                textSplitAnimations.resetTextSplit(inputElement, '');

                // Focus the input for the next message if it's an input element
                if (inputElement instanceof HTMLInputElement || inputElement instanceof HTMLTextAreaElement) {
                    setTimeout(() => inputElement.focus(), 50);
                }

                // Call custom callback if provided
                if (onComplete) {
                    onComplete();
                }
            }, 100);
        }
    });
};

// Auto-detect and initialize text split effects in markdown
export const initializeMarkdownTextSplit = () => {
    const textSplitElements = document.querySelectorAll('[data-effect="textsplit"]');

    textSplitElements.forEach((element) => {
        const htmlElement = element as HTMLElement;
        const originalText = htmlElement.getAttribute('data-original-text') || htmlElement.textContent || '';

        // Add hover effect for demonstration
        htmlElement.addEventListener('mouseenter', () => {
            textSplitAnimations.flyToSend(htmlElement, {
                duration: 0.6,
                stagger: 0.02,
                ease: 'power1.out'
            });
        });

        htmlElement.addEventListener('mouseleave', () => {
            setTimeout(() => {
                textSplitAnimations.resetTextSplit(htmlElement, originalText);
            }, 500);
        });
    });
};

// Export default GSAP instance with plugins registered
export { gsap };
export default gsap;
