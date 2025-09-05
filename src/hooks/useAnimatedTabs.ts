import { useCallback, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { prefersReducedMotion } from '../lib/utils';

export const useAnimatedTabs = (activeTab: string) => {
  const tabBarRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // Register a tab element
  const registerTab = useCallback((tabKey: string, element: HTMLButtonElement | null) => {
    if (element) {
      tabRefs.current.set(tabKey, element);
    } else {
      tabRefs.current.delete(tabKey);
    }
  }, []);

  // Update indicator position and tab states
  const updateIndicator = useCallback(() => {
    const activeTabElement = tabRefs.current.get(activeTab);
    const tabBar = tabBarRef.current;

    if (!activeTabElement || !tabBar) return;

    const tabBarRect = tabBar.getBoundingClientRect();
    const activeTabRect = activeTabElement.getBoundingClientRect();

    // Calculate position relative to tab bar
    const left = activeTabRect.left - tabBarRect.left;
    const width = activeTabRect.width;

    // Update CSS custom properties for the indicator
    tabBar.style.setProperty('--indicator-left', `${left}px`);
    tabBar.style.setProperty('--indicator-width', `${width}px`);
    tabBar.style.setProperty('--indicator-opacity', '1');
    tabBar.style.setProperty('--indicator-scale', '1');

    // Add interacting class for enhanced glow
    tabBar.classList.add('interacting');
    setTimeout(() => tabBar.classList.remove('interacting'), 600);

    // Update tab states
    tabRefs.current.forEach((tabElement, tabKey) => {
      const isActive = tabKey === activeTab;

      if (isActive) {
        tabElement.classList.add('active');
        // Add ripple effect
        tabElement.classList.add('ripple');
        setTimeout(() => tabElement.classList.remove('ripple'), 600);
      } else {
        tabElement.classList.remove('active');
      }
    });
  }, [activeTab]);

  // Initialize indicator on first render
  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(updateIndicator, 100);
    return () => clearTimeout(timer);
  }, [updateIndicator]);

  // Update indicator when active tab changes
  useEffect(() => {
    updateIndicator();
  }, [activeTab, updateIndicator]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => updateIndicator();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateIndicator]);

  // Tab click handler with animations
  const handleTabClick = useCallback((tabKey: string, onClick: (tab: string) => void) => {
    return (event: React.MouseEvent<HTMLButtonElement>) => {
      const tabElement = event.currentTarget;

      if (!prefersReducedMotion()) {
        // Animate the click
        gsap.fromTo(
          tabElement,
          { scale: 1 },
          {
            scale: 0.95,
            duration: 0.1,
            ease: 'power2.out',
            yoyo: true,
            repeat: 1,
          },
        );

        // Add a subtle glow effect
        gsap.fromTo(
          tabElement,
          { boxShadow: '0 0 0 rgba(203, 166, 247, 0)' },
          {
            boxShadow: '0 0 20px rgba(203, 166, 247, 0.5)',
            duration: 0.3,
            ease: 'power2.out',
            yoyo: true,
            repeat: 1,
          },
        );
      }

      // Call the original click handler
      onClick(tabKey);
    };
  }, []);

  // Enhanced hover effects
  const handleTabHover = useCallback((isEntering: boolean) => {
    return (event: React.MouseEvent<HTMLButtonElement>) => {
      const tabElement = event.currentTarget;
      const emoji = tabElement.querySelector('.tab-emoji');

      if (!prefersReducedMotion()) {
        if (isEntering) {
          gsap.to(tabElement, {
            y: -2,
            scale: 1.02,
            duration: 0.3,
            ease: 'power2.out',
          });

          if (emoji) {
            gsap.to(emoji, {
              scale: 1.1,
              rotation: 5,
              duration: 0.3,
              ease: 'back.out(1.7)',
            });
          }
        } else {
          gsap.to(tabElement, {
            y: 0,
            scale: 1,
            duration: 0.3,
            ease: 'power2.out',
          });

          if (emoji) {
            gsap.to(emoji, {
              scale: 1,
              rotation: 0,
              duration: 0.3,
              ease: 'power2.out',
            });
          }
        }
      }
    };
  }, []);

  return {
    tabBarRef,
    registerTab,
    handleTabClick,
    handleTabHover,
    updateIndicator,
  };
};
