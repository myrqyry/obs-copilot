import type { StateCreator } from 'zustand';
export interface UIAnimationState {
    enableAnimations: boolean;
    reduceMotion: boolean;
    animationSpeed: 'fast' | 'normal' | 'slow';
    isTabTransitioning: boolean;
    activeAnimations: Set<string>;
    glassIntensity: number;
    blurStrength: number;
    enhancedFocus: boolean;
    focusRingStyle: 'subtle' | 'prominent' | 'minimal';
    globalLoading: boolean;
    componentLoading: Record<string, boolean>;
}
export interface UIAnimationActions {
    setEnableAnimations: (enabled: boolean) => void;
    setAnimationSpeed: (speed: 'fast' | 'normal' | 'slow') => void;
    setReduceMotion: (reduce: boolean) => void;
    setTabTransitioning: (transitioning: boolean) => void;
    addActiveAnimation: (id: string) => void;
    removeActiveAnimation: (id: string) => void;
    clearActiveAnimations: () => void;
    setGlassIntensity: (intensity: number) => void;
    setBlurStrength: (strength: number) => void;
    setEnhancedFocus: (enabled: boolean) => void;
    setFocusRingStyle: (style: 'subtle' | 'prominent' | 'minimal') => void;
    setGlobalLoading: (loading: boolean) => void;
    setComponentLoading: (component: string, loading: boolean) => void;
}
export type UIAnimationSlice = UIAnimationState & UIAnimationActions;
export declare const createUIAnimationSlice: StateCreator<UIAnimationSlice, [
], [
], UIAnimationSlice>;
/**
 * Animation duration helpers based on speed preference
 */
export declare const getAnimationDuration: (baseMs: number, speed?: "fast" | "normal" | "slow") => number;
/**
 * CSS custom properties manager for dynamic theming
 */
export declare const updateCSSProperties: (state: Partial<UIAnimationState>) => void;
/**
 * Responsive animation utilities
 */
export declare const responsiveAnimations: {
    /**
     * Check if device prefers reduced motion
     */
    prefersReducedMotion: () => boolean;
    /**
     * Check if device has sufficient performance for complex animations
     */
    hasHighPerformance: () => boolean;
    /**
     * Get optimal animation complexity based on device capabilities
     */
    getAnimationComplexity: () => "minimal" | "standard" | "enhanced";
};
/**
 * Performance monitoring for animations
 */
export declare class AnimationPerformanceMonitor {
    private frameCount;
    private lastTime;
    private fps;
    update(): void;
    getFPS(): number;
    shouldReduceComplexity(): boolean;
}
