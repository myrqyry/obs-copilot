import { useCallback, useMemo } from 'react';
import { useUiStore } from '@/store';

interface UseAppLayoutReturn {
    activeTab: string;
    setActiveTab: (tabId: string) => void;
    flipSides: boolean;
    layoutClasses: {
        container: string;
        content: string;
    };
    getContentOrderClass: () => string;
}

export function useAppLayout(): UseAppLayoutReturn {
    const activeTab = useUiStore(state => state.activeTab);
    const setActiveTabInternal = useUiStore(state => state.setActiveTab);
    const flipSides = useUiStore(state => state.flipSides);
    
    const setActiveTab = useCallback((tabId: string) => {
        setActiveTabInternal(tabId);
        
        // Optional: Log analytics or trigger side effects
        if (import.meta.env.DEV) {
            console.log(`[AppLayout] Tab changed: ${tabId}`);
        }
    }, [setActiveTabInternal]);
    
    const layoutClasses = useMemo(() => ({
        container: 'app-root h-screen max-h-screen bg-gradient-to-br from-background to-card text-foreground flex flex-col transition-colors duration-500 ease-in-out',
        content: 'flex-grow overflow-y-auto px-1 sm:px-2 pb-1 transition-all duration-300 ease-in-out'
    }), []);
    
    const getContentOrderClass = useCallback(() => {
        return flipSides ? 'order-last' : 'order-first';
    }, [flipSides]);
    
    return {
        activeTab,
        setActiveTab,
        flipSides,
        layoutClasses,
        getContentOrderClass
    };
}
