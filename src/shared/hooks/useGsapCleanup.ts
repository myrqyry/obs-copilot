import { useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';

/**
 * Custom hook for managing GSAP animations with automatic cleanup
 * Prevents memory leaks by properly disposing of GSAP timelines and animations
 */

interface GsapAnimation {
    timeline?: gsap.core.Timeline;
    tweens?: gsap.core.Tween[];
    context?: gsap.Context;
}

interface UseGsapCleanupOptions {
    /**
     * Whether to kill animations immediately on cleanup
     * @default true
     */
    killImmediately?: boolean;
    
    /**
     * Whether to revert animations to their original state on cleanup
     * @default false
     */
    revert?: boolean;
    
    /**
     * Custom cleanup function to run before GSAP cleanup
     */
    onCleanup?: () => void;
}

/**
 * Hook for managing GSAP animations with automatic cleanup
 * @param options Configuration options for cleanup behavior
 * @returns Object with animation management utilities
 */
export const useGsapCleanup = (options: UseGsapCleanupOptions = {}) => {
    const {
        killImmediately = true,
        revert = false,
        onCleanup
    } = options;

    const animationsRef = useRef<GsapAnimation[]>([]);
    const contextRef = useRef<gsap.Context | null>(null);

    // Create a GSAP context for scoped animations
    const createContext = useCallback(() => {
        if (!contextRef.current) {
            contextRef.current = gsap.context(() => {});
        }
        return contextRef.current;
    }, []);

    // Register an animation for cleanup
    const registerAnimation = useCallback((animation: GsapAnimation) => {
        animationsRef.current.push(animation);
        return animation;
    }, []);

    // Create a timeline with automatic registration
    const createTimeline = useCallback((vars?: gsap.TimelineVars) => {
        const timeline = gsap.timeline(vars);
        registerAnimation({ timeline });
        return timeline;
    }, [registerAnimation]);

    // Create a tween with automatic registration
    const createTween = useCallback((target: gsap.TweenTarget, vars: gsap.TweenVars) => {
        const tween = gsap.to(target, vars);
        registerAnimation({ tweens: [tween] });
        return tween;
    }, [registerAnimation]);

    // Create a fromTo tween with automatic registration
    const createFromToTween = useCallback((
        target: gsap.TweenTarget, 
        fromVars: gsap.TweenVars, 
        toVars: gsap.TweenVars
    ) => {
        const tween = gsap.fromTo(target, fromVars, toVars);
        registerAnimation({ tweens: [tween] });
        return tween;
    }, [registerAnimation]);

    // Create a set with automatic registration
    const createSet = useCallback((target: gsap.TweenTarget, vars: gsap.TweenVars) => {
        const tween = gsap.set(target, vars);
        registerAnimation({ tweens: [tween] });
        return tween;
    }, [registerAnimation]);

    // Manual cleanup function
    const cleanup = useCallback(() => {
        // Run custom cleanup first
        if (onCleanup) {
            try {
                onCleanup();
            } catch (error) {
                console.warn('Error in custom GSAP cleanup:', error);
            }
        }

        // Clean up all registered animations
        animationsRef.current.forEach((animation) => {
            try {
                // Clean up timeline
                if (animation.timeline) {
                    if (revert) {
                        animation.timeline.revert();
                    }
                    if (killImmediately) {
                        animation.timeline.kill();
                    } else {
                        animation.timeline.pause().clear();
                    }
                }

                // Clean up individual tweens
                if (animation.tweens) {
                    animation.tweens.forEach((tween) => {
                        if (revert) {
                            tween.revert();
                        }
                        if (killImmediately) {
                            tween.kill();
                        } else {
                            tween.pause();
                        }
                    });
                }

                // Clean up context
                if (animation.context) {
                    animation.context.kill();
                }
            } catch (error) {
                console.warn('Error cleaning up GSAP animation:', error);
            }
        });

        // Clean up main context
        if (contextRef.current) {
            try {
                contextRef.current.kill();
                contextRef.current = null;
            } catch (error) {
                console.warn('Error cleaning up GSAP context:', error);
            }
        }

        // Clear animations array
        animationsRef.current = [];
    }, [killImmediately, revert, onCleanup]);

    // Automatic cleanup on unmount
    useEffect(() => {
        return cleanup;
    }, [cleanup]);

    // Kill all animations immediately (emergency cleanup)
    const killAll = useCallback(() => {
        gsap.killTweensOf("*");
        cleanup();
    }, [cleanup]);

    // Pause all registered animations
    const pauseAll = useCallback(() => {
        animationsRef.current.forEach((animation) => {
            if (animation.timeline) {
                animation.timeline.pause();
            }
            if (animation.tweens) {
                animation.tweens.forEach((tween) => tween.pause());
            }
        });
    }, []);

    // Resume all registered animations
    const resumeAll = useCallback(() => {
        animationsRef.current.forEach((animation) => {
            if (animation.timeline) {
                animation.timeline.resume();
            }
            if (animation.tweens) {
                animation.tweens.forEach((tween) => tween.resume());
            }
        });
    }, []);

    // Get animation count for debugging
    const getAnimationCount = useCallback(() => {
        return animationsRef.current.length;
    }, []);

    return {
        // Animation creators
        createContext,
        createTimeline,
        createTween,
        createFromToTween,
        createSet,
        
        // Animation management
        registerAnimation,
        cleanup,
        killAll,
        pauseAll,
        resumeAll,
        
        // Utilities
        getAnimationCount,
        
        // Direct access to context (use with caution)
        context: contextRef.current,
    };
};

/**
 * Simplified hook for basic GSAP timeline management
 * @param options Configuration options
 * @returns Timeline with automatic cleanup
 */
export const useGsapTimeline = (
    vars?: gsap.TimelineVars,
    options: UseGsapCleanupOptions = {}
) => {
    const { createTimeline } = useGsapCleanup(options);
    
    const timelineRef = useRef<gsap.core.Timeline | null>(null);
    
    useEffect(() => {
        if (!timelineRef.current) {
            timelineRef.current = createTimeline(vars);
        }
    }, [createTimeline, vars]);
    
    return timelineRef.current;
};

/**
 * Hook for creating a scoped GSAP context
 * All animations created within this context will be automatically cleaned up
 * @param options Configuration options
 * @returns GSAP context
 */
export const useGsapContext = (options: UseGsapCleanupOptions = {}) => {
    const { createContext } = useGsapCleanup(options);
    
    const contextRef = useRef<gsap.Context | null>(null);
    
    useEffect(() => {
        if (!contextRef.current) {
            contextRef.current = createContext();
        }
    }, [createContext]);
    
    return contextRef.current;
};

export default useGsapCleanup;
