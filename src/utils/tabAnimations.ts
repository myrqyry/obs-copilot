import { gsap } from 'gsap';

/**
 * Tab Animation System
 * Provides smooth GSAP-powered transitions for tab content
 */

export const tabAnimations = {
    /**
     * Animate tab content entrance
     */
    animateTabEnter: (element: HTMLElement, direction: 'left' | 'right' = 'left') => {
        const timeline = gsap.timeline();

        // Set initial state
        gsap.set(element, {
            opacity: 0,
            x: direction === 'left' ? -30 : 30,
            scale: 0.98
        });

        // Animate in
        timeline.to(element, {
            opacity: 1,
            x: 0,
            scale: 1,
            duration: 0.4,
            ease: 'power2.out'
        });

        return timeline;
    },

    /**
     * Animate tab content exit
     */
    animateTabExit: (element: HTMLElement, direction: 'left' | 'right' = 'right') => {
        const timeline = gsap.timeline();

        timeline.to(element, {
            opacity: 0,
            x: direction === 'left' ? -30 : 30,
            scale: 0.98,
            duration: 0.3,
            ease: 'power2.in'
        });

        return timeline;
    },

    /**
     * Animate tab button state change
     */
    animateTabButton: (element: HTMLElement, isActive: boolean) => {
        const timeline = gsap.timeline();

        if (isActive) {
            timeline
                .to(element, {
                    scale: 1.05,
                    duration: 0.2,
                    ease: 'back.out(1.7)'
                })
                .to(element, {
                    scale: 1,
                    duration: 0.2,
                    ease: 'power2.out'
                });
        } else {
            timeline.to(element, {
                scale: 1,
                duration: 0.2,
                ease: 'power2.out'
            });
        }

        return timeline;
    },

    /**
     * Staggered animation for tab container children
     */
    animateTabChildren: (container: HTMLElement, delay: number = 0.1) => {
        const children = Array.from(container.children) as HTMLElement[];

        gsap.set(children, {
            opacity: 0,
            y: 20,
            scale: 0.95
        });

        gsap.to(children, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.5,
            ease: 'power2.out',
            stagger: delay
        });
    },

    /**
     * Smooth height transition for collapsible content
     */
    animateHeight: (element: HTMLElement, expand: boolean) => {
        const timeline = gsap.timeline();

        if (expand) {
            // Get natural height
            gsap.set(element, { height: 'auto' });
            const naturalHeight = element.offsetHeight;
            gsap.set(element, { height: 0 });

            timeline.to(element, {
                height: naturalHeight,
                duration: 0.4,
                ease: 'power2.out'
            });
        } else {
            timeline.to(element, {
                height: 0,
                duration: 0.3,
                ease: 'power2.in'
            });
        }

        return timeline;
    },

    /**
     * Glass card entrance animation
     */
    animateGlassCard: (element: HTMLElement) => {
        const timeline = gsap.timeline();

        gsap.set(element, {
            opacity: 0,
            scale: 0.9,
            y: 30
        });

        timeline.to(element, {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.6,
            ease: 'back.out(1.7)'
        });

        return timeline;
    },

    /**
     * Connection status animation
     */
    animateConnectionStatus: (element: HTMLElement, isConnected: boolean) => {
        const timeline = gsap.timeline();

        if (isConnected) {
            timeline
                .to(element, {
                    scale: 1.1,
                    duration: 0.2,
                    ease: 'power2.out'
                })
                .to(element, {
                    scale: 1,
                    duration: 0.3,
                    ease: 'elastic.out(1, 0.3)'
                });
        } else {
            timeline.to(element, {
                scale: 0.9,
                opacity: 0.7,
                duration: 0.2,
                ease: 'power2.out'
            });
        }

        return timeline;
    },

    /**
     * Message entrance animation for chat
     */
    animateMessage: (element: HTMLElement, fromUser: boolean = false) => {
        const timeline = gsap.timeline();

        gsap.set(element, {
            opacity: 0,
            x: fromUser ? 30 : -30,
            scale: 0.95
        });

        timeline.to(element, {
            opacity: 1,
            x: 0,
            scale: 1,
            duration: 0.4,
            ease: 'back.out(1.7)'
        });

        return timeline;
    },

    /**
     * Notification pop-in animation
     */
    animateNotification: (element: HTMLElement) => {
        const timeline = gsap.timeline();

        gsap.set(element, {
            opacity: 0,
            scale: 0.8,
            y: -20
        });

        timeline
            .to(element, {
                opacity: 1,
                scale: 1.05,
                y: 0,
                duration: 0.3,
                ease: 'back.out(1.7)'
            })
            .to(element, {
                scale: 1,
                duration: 0.2,
                ease: 'power2.out'
            });

        return timeline;
    },

    /**
     * Status indicator pulse
     */
    animateStatusPulse: (element: HTMLElement, color: string = 'currentColor') => {
        return gsap.to(element, {
            boxShadow: `0 0 20px ${color}, 0 0 40px ${color}`,
            scale: 1.1,
            duration: 1.5,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true
        });
    }
};

/**
 * Tab transition manager
 * Handles coordinated tab switching animations
 */
export class TabTransitionManager {
    private currentElement: HTMLElement | null = null;
    private isAnimating = false;

    async switchTab(newElement: HTMLElement, direction: 'left' | 'right' = 'left') {
        if (this.isAnimating) return;

        this.isAnimating = true;

        try {
            // Exit current tab if exists
            if (this.currentElement) {
                await tabAnimations.animateTabExit(this.currentElement, direction);
                this.currentElement.style.display = 'none';
            }

            // Show and enter new tab
            newElement.style.display = 'block';
            await tabAnimations.animateTabEnter(newElement, direction);

            // Animate children with stagger
            tabAnimations.animateTabChildren(newElement);

            this.currentElement = newElement;
        } finally {
            this.isAnimating = false;
        }
    }

    isTransitioning() {
        return this.isAnimating;
    }
}
