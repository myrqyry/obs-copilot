// (Removed duplicate export of createUIAnimationSlice)
export const createUIAnimationSlice = (set) => ({
    // Initial state
    enableAnimations: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    animationSpeed: 'normal',
    isTabTransitioning: false,
    activeAnimations: new Set(),
    glassIntensity: 0.7,
    blurStrength: 16,
    enhancedFocus: true,
    focusRingStyle: 'prominent',
    globalLoading: false,
    componentLoading: {},
    // Actions
    setEnableAnimations: (enabled) => set({ enableAnimations: enabled }),
    setAnimationSpeed: (speed) => set({ animationSpeed: speed }),
    setReduceMotion: (reduce) => set({
        reduceMotion: reduce,
        enableAnimations: !reduce
    }),
    setTabTransitioning: (transitioning) => set({ isTabTransitioning: transitioning }),
    addActiveAnimation: (id) => set((state) => ({
        activeAnimations: new Set([...state.activeAnimations, id])
    })),
    removeActiveAnimation: (id) => set((state) => {
        const newSet = new Set(state.activeAnimations);
        newSet.delete(id);
        return { activeAnimations: newSet };
    }),
    clearActiveAnimations: () => set({ activeAnimations: new Set() }),
    setGlassIntensity: (intensity) => set({ glassIntensity: intensity }),
    setBlurStrength: (strength) => set({ blurStrength: strength }),
    setEnhancedFocus: (enabled) => set({ enhancedFocus: enabled }),
    setFocusRingStyle: (style) => set({ focusRingStyle: style }),
    setGlobalLoading: (loading) => set({ globalLoading: loading }),
    setComponentLoading: (component, loading) => set((state) => ({
        componentLoading: {
            ...state.componentLoading,
            [component]: loading
        }
    }))
});
/**
 * Animation duration helpers based on speed preference
 */
export const getAnimationDuration = (baseMs, speed = 'normal') => {
    const multipliers = {
        fast: 0.5,
        normal: 1,
        slow: 1.5
    };
    return baseMs * multipliers[speed];
};
/**
 * CSS custom properties manager for dynamic theming
 */
export const updateCSSProperties = (state) => {
    const root = document.documentElement;
    if (state.glassIntensity !== undefined) {
        root.style.setProperty('--glass-opacity', state.glassIntensity.toString());
    }
    if (state.blurStrength !== undefined) {
        root.style.setProperty('--glass-blur', `${state.blurStrength}px`);
    }
    if (state.focusRingStyle !== undefined) {
        const styles = {
            subtle: { width: '1px', opacity: '0.3' },
            prominent: { width: '2px', opacity: '0.5' },
            minimal: { width: '1px', opacity: '0.2' }
        };
        const style = styles[state.focusRingStyle];
        root.style.setProperty('--focus-ring-width', style.width);
        root.style.setProperty('--focus-ring-opacity', style.opacity);
    }
    if (state.enableAnimations !== undefined) {
        root.style.setProperty('--animations-enabled', state.enableAnimations ? '1' : '0');
    }
};
/**
 * Responsive animation utilities
 */
export const responsiveAnimations = {
    /**
     * Check if device prefers reduced motion
     */
    prefersReducedMotion: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    /**
     * Check if device has sufficient performance for complex animations
     */
    hasHighPerformance: () => {
        // Simple heuristic based on hardware concurrency and memory
        const cores = navigator.hardwareConcurrency || 1;
        const memory = navigator.deviceMemory || 1;
        return cores >= 4 && memory >= 4;
    },
    /**
     * Get optimal animation complexity based on device capabilities
     */
    getAnimationComplexity: () => {
        if (responsiveAnimations.prefersReducedMotion())
            return 'minimal';
        if (!responsiveAnimations.hasHighPerformance())
            return 'standard';
        return 'enhanced';
    }
};
/**
 * Performance monitoring for animations
 */
export class AnimationPerformanceMonitor {
    frameCount = 0;
    lastTime = performance.now();
    fps = 60;
    update() {
        this.frameCount++;
        const currentTime = performance.now();
        if (currentTime >= this.lastTime + 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
            this.frameCount = 0;
            this.lastTime = currentTime;
        }
        requestAnimationFrame(() => this.update());
    }
    getFPS() {
        return this.fps;
    }
    shouldReduceComplexity() {
        return this.fps < 45; // Reduce complexity if FPS drops below 45
    }
}
