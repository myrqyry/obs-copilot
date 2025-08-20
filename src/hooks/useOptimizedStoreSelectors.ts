import { useMemo } from 'react';
import { useConnectionManagerStore } from '@/store/connectionManagerStore';
import { useChatStore } from '@/store/chatStore';
import { useSettingsStore } from '@/store/settingsStore';

// Define proper interfaces to replace 'any' types
interface ConnectionState {
    isConnected: boolean;
    sources: any[];
    currentProgramScene: string | null;
}

interface ChatState {
    messages: any[];
    isGeminiClientInitialized: boolean;
    actions: any;
}

interface SettingsState {
    extraDarkMode: boolean;
    flipSides: boolean;
    theme: {
        accent: string;
        userChatBubble: string;
        modelChatBubble: string;
    };
}

/**
 * Optimized store selectors that combine multiple subscriptions
 * to reduce re-renders and improve performance
 */

// Combined connection state selector
export const useConnectionState = (): ConnectionState => {
    return useConnectionManagerStore(
        useMemo(
            () => (state: any) => ({
                isConnected: state.isConnected,
                sources: state.sources,
                currentProgramScene: state.currentProgramScene,
            }),
            []
        )
    );
};

// Combined chat state selector
export const useChatState = (): ChatState => {
    return useChatStore(
        useMemo(
            () => (state: any) => ({
                messages: state.geminiMessages,
                isGeminiClientInitialized: state.isGeminiClientInitialized,
                actions: state.actions,
            }),
            []
        )
    );
};

// Combined settings state selector
export const useSettingsState = (): SettingsState => {
    return useSettingsStore(
        useMemo(
            () => (state: any) => ({
                extraDarkMode: state.extraDarkMode,
                flipSides: state.flipSides,
                theme: {
                    accent: state.theme.accent,
                    userChatBubble: state.theme.userChatBubble,
                    modelChatBubble: state.theme.modelChatBubble,
                },
            }),
            []
        )
    );
};

// Memoized selector for OBS data to prevent unnecessary recalculations
export const useObsData = () => {
    const connectionState = useConnectionState();
    
    // Get additional OBS data using separate selectors
    const scenes = useConnectionManagerStore((state: any) => state.scenes);
    const streamStatus = useConnectionManagerStore((state: any) => state.streamStatus);
    const recordStatus = useConnectionManagerStore((state: any) => state.recordStatus);
    const videoSettings = useConnectionManagerStore((state: any) => state.videoSettings);
    
    return useMemo(() => ({
        scenes,
        currentProgramScene: connectionState.currentProgramScene,
        sources: connectionState.sources,
        streamStatus,
        recordStatus,
        videoSettings,
    }), [
        scenes,
        connectionState.currentProgramScene,
        connectionState.sources,
        streamStatus,
        recordStatus,
        videoSettings,
    ]);
};

// Performance monitoring hook
export const usePerformanceMonitor = (componentName: string) => {
    useMemo(() => {
        if (process.env.NODE_ENV === 'development') {
            const startTime = performance.now();
            
            // Log render time after component mounts/updates
            setTimeout(() => {
                const endTime = performance.now();
                const renderTime = endTime - startTime;
                
                if (renderTime > 16) { // More than one frame (60fps)
                    console.warn(
                        `[Performance] ${componentName} render took ${renderTime.toFixed(2)}ms`
                    );
                }
            }, 0);
        }
    }, [componentName]);
};

// Shallow comparison utility for store selectors
export const shallowEqual = (a: any, b: any): boolean => {
    if (a === b) return true;
    
    if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
        return false;
    }
    
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    for (const key of keysA) {
        if (!keysB.includes(key) || a[key] !== b[key]) {
            return false;
        }
    }
    
    return true;
};

// Custom hook for optimized store subscriptions with shallow comparison
export const useShallowStore = <T>(
    store: any,
    selector: (state: any) => T
): T => {
    return store(selector, shallowEqual);
};
