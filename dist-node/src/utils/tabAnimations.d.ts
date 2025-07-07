/**
 * Tab Animation System
 * Provides smooth GSAP-powered transitions for tab content
 */
export declare const tabAnimations: {
    /**
     * Animate tab content entrance
     */
    animateTabEnter: (element: HTMLElement, direction?: "left" | "right") => gsap.core.Timeline;
    /**
     * Animate tab content exit
     */
    animateTabExit: (element: HTMLElement, direction?: "left" | "right") => gsap.core.Timeline;
    /**
     * Animate tab button state change
     */
    animateTabButton: (element: HTMLElement, isActive: boolean) => gsap.core.Timeline;
    /**
     * Staggered animation for tab container children
     */
    animateTabChildren: (container: HTMLElement, delay?: number) => void;
    /**
     * Smooth height transition for collapsible content
     */
    animateHeight: (element: HTMLElement, expand: boolean) => gsap.core.Timeline;
    /**
     * Glass card entrance animation
     */
    animateGlassCard: (element: HTMLElement) => gsap.core.Timeline;
    /**
     * Connection status animation
     */
    animateConnectionStatus: (element: HTMLElement, isConnected: boolean) => gsap.core.Timeline;
    /**
     * Message entrance animation for chat
     */
    animateMessage: (element: HTMLElement, fromUser?: boolean) => gsap.core.Timeline;
    /**
     * Notification pop-in animation
     */
    animateNotification: (element: HTMLElement) => gsap.core.Timeline;
    /**
     * Status indicator pulse
     */
    animateStatusPulse: (element: HTMLElement, color?: string) => gsap.core.Tween;
};
/**
 * Tab transition manager
 * Handles coordinated tab switching animations
 */
export declare class TabTransitionManager {
    private currentElement;
    private isAnimating;
    switchTab(newElement: HTMLElement, direction?: 'left' | 'right'): Promise<void>;
    isTransitioning(): boolean;
}
