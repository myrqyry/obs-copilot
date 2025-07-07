import { gsap } from 'gsap';
export declare const ANIMATION_CONFIG: {
    readonly FAST: 0.3;
    readonly NORMAL: 0.6;
    readonly SLOW: 1.2;
    readonly VERY_SLOW: 2.4;
    readonly EASE_SMOOTH: "power2.inOut";
    readonly EASE_BOUNCE: "back.out(1.7)";
    readonly EASE_ELASTIC: "elastic.out(1, 0.3)";
    readonly EASE_QUICK: "power3.out";
    readonly SHORT_DELAY: 0.2;
    readonly MEDIUM_DELAY: 0.5;
    readonly LONG_DELAY: 1;
};
export declare const logoAnimations: {
    /**
     * Pulse animation for logos
     */
    pulse: (element: HTMLElement | SVGElement, options?: {
        scale?: number;
        duration?: number;
        repeat?: number;
    }) => gsap.core.Tween;
    /**
     * Rotation animation for logos
     */
    rotate: (element: HTMLElement | SVGElement, options?: {
        duration?: number;
        repeat?: number;
        direction?: "clockwise" | "counterclockwise";
    }) => gsap.core.Tween;
    /**
     * Combined sparkle pulse and rotation for Gemini logo
     */
    geminiSparkle: (element: HTMLElement | SVGElement) => gsap.core.Timeline;
    /**
     * Fade in animation with scale
     */
    fadeInScale: (element: HTMLElement | SVGElement, options?: {
        delay?: number;
        duration?: number;
        scale?: number;
    }) => gsap.core.Tween;
};
export declare const uiAnimations: {
    /**
     * Modal appearance animation
     */
    modalAppear: (element: HTMLElement, options?: {
        delay?: number;
        duration?: number;
    }) => gsap.core.Tween;
    /**
     * Button hover animation
     */
    buttonHover: (element: HTMLElement) => gsap.core.Timeline;
    /**
     * Loading dots animation
     */
    loadingDots: (dots: HTMLElement[]) => gsap.core.Timeline;
    /**
     * Tab content transition animation
     */
    tabContentTransition: (element: HTMLElement, options?: {
        direction?: "left" | "right" | "up" | "down";
        duration?: number;
        delay?: number;
    }) => gsap.core.Tween;
    /**
     * Staggered children animation
     */
    staggerChildren: (parent: HTMLElement, options?: {
        stagger?: number;
        duration?: number;
        from?: "start" | "center" | "end";
    }) => gsap.core.Tween;
};
export declare const gsapUtils: {
    /**
     * Kill all animations on an element
     */
    killAnimations: (element: HTMLElement | SVGElement | string) => void;
    /**
     * Set element to be GSAP-ready (prevents FOUC)
     */
    setReady: (element: HTMLElement | SVGElement) => void;
    /**
     * Initialize element for GSAP animations
     */
    initElement: (element: HTMLElement | SVGElement) => void;
    /**
     * Create a master timeline for coordinated animations
     */
    createMasterTimeline: (options?: gsap.TimelineVars) => gsap.core.Timeline;
};
export declare const textSplitAnimations: {
    /**
     * Split text into individual letters and wrap them in spans
     */
    splitText: (element: HTMLElement | string) => HTMLElement[];
    /**
     * Animate letters flying to the right (toward send button)
     */
    flyToSend: (element: HTMLElement | string, options?: {
        duration?: number;
        stagger?: number;
        ease?: string;
        direction?: "right" | "topRight";
        onComplete?: () => void;
    }) => gsap.core.Timeline;
    /**
     * Reverse animation - letters flying in from the right
     */
    flyFromSend: (element: HTMLElement | string, text: string, options?: {
        duration?: number;
        stagger?: number;
        ease?: string;
        onComplete?: () => void;
    }) => gsap.core.Tween;
    /**
     * Reset text split elements to normal state
     */
    resetTextSplit: (element: HTMLElement | string, originalText?: string) => void;
    /**
     * Create a typewriter effect with text split
     */
    typewriter: (element: HTMLElement | string, text: string, options?: {
        duration?: number;
        ease?: string;
        onComplete?: () => void;
    }) => gsap.core.Tween;
};
export declare const triggerTextSplitOnSend: (inputElement: HTMLElement, sendButtonElement?: HTMLElement, onComplete?: () => void) => gsap.core.Timeline;
export declare const initializeMarkdownTextSplit: () => void;
export { gsap };
export default gsap;
