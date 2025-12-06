import { useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useUiStore } from '@/app/store';

interface UseAppLayoutReturn {
    activeTab: string;
    setActiveTab: (tabId: string) => void;
    flipSides: boolean;
    layoutClasses: {
        container: string;
        content: string;
    };
    getContentOrderClass: () => string;
    contentOrderClass: string;
}

export function useAppLayout(): UseAppLayoutReturn {
    // Use shallow selector to prevent unnecessary re-renders
    const { activeTab, setActiveTab: setActiveTabInternal, flipSides } = useUiStore(
        useShallow(state => ({
            activeTab: state.activeTab,
            setActiveTab: state.setActiveTab,
            flipSides: state.flipSides
        }))
    );
    
    // Memoize the tab change handler
    const setActiveTab = useCallback((tabId: string) => {
        if (tabId !== activeTab) {
            setActiveTabInternal(tabId);
            
            // Optional: Log analytics or trigger side effects
            if (import.meta.env.DEV) {
                console.log(`[AppLayout] Tab changed: ${activeTab} → ${tabId}`);
            }
        }
    }, [activeTab, setActiveTabInternal]);
    
    // Memoize layout classes (these rarely change)
    const layoutClasses = useMemo(() => ({
        container: 'app-root h-screen max-h-screen bg-gradient-to-br from-background to-card text-foreground flex flex-col transition-colors duration-500 ease-in-out',
        content: 'flex-grow overflow-y-auto px-1 sm:px-2 pb-1 transition-all duration-300 ease-in-out'
    }), []);
    
    // Pre-compute the order class instead of using a callback
    const contentOrderClass = useMemo(() => {
        return flipSides ? 'order-last' : 'order-first';
    }, [flipSides]);
    
    // Keep the callback version for backwards compatibility
    const getContentOrderClass = useCallback(() => {
        return contentOrderClass;
    }, [contentOrderClass]);
    
    return {
        activeTab,
        setActiveTab,
        flipSides,
        layoutClasses,
        getContentOrderClass,
        contentOrderClass  // Return pre-computed version too
    };
}
