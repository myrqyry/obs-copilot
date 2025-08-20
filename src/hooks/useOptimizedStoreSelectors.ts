import { useMemo, useCallback } from 'react';
import { useConnectionManagerStore } from '@/store/connectionManagerStore';
import { useChatStore } from '@/store/chatStore';
import { useSettingsStore } from '@/store/settingsStore';

// Define proper interfaces to replace 'any' types
interface ObsSource {
    name: string;
    type: string;
    visible: boolean;
    enabled: boolean;
    id?: string;
    settings?: Record<string, unknown>;
}

interface ObsScene {
    name: string;
    sources: ObsSource[];
    current?: boolean;
}

interface StreamStatus {
    active: boolean;
    recording: boolean;
    streaming: boolean;
    duration?: number;
}

interface VideoSettings {
    width: number;
    height: number;
    fps: number;
    format?: string;
}

interface ConnectionState {
    isConnected: boolean;
    sources: ObsSource[];
    currentProgramScene: string | null;
}

interface GeminiMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
    metadata?: Record<string, unknown>;
}

interface ChatActions {
    addMessage: (message: Omit<GeminiMessage, 'id' | 'timestamp'>) => void;
    clearMessages: () => void;
    setGlobalErrorMessage: (message: string | null) => void;
    updateMessage: (id: string, updates: Partial<GeminiMessage>) => void;
}

interface ChatState {
    messages: GeminiMessage[];
    isGeminiClientInitialized: boolean;
    actions: ChatActions;
}

interface ThemeColors {
    accent: string;
    userChatBubble: string;
    modelChatBubble: string;
}

interface SettingsState {
    extraDarkMode: boolean;
    flipSides: boolean;
    theme: ThemeColors;
}

/**
 * Optimized store selectors that combine multiple subscriptions
 * to reduce re-renders and improve performance
 */

// Define store state interfaces for proper typing
interface ConnectionStoreState {
    isConnected: boolean;
    sources: ObsSource[];
    currentProgramScene: string | null;
    scenes: ObsScene[];
    streamStatus: StreamStatus;
    recordStatus: StreamStatus;
    videoSettings: VideoSettings;
    onRefreshData?: () => void | Promise<void>;
    streamerBotServiceInstance?: any;
    actions?: any;
}

export const useConnectionState = (): ConnectionState => {
    return useConnectionManagerStore(
        useCallback(
            (state: ConnectionStoreState) => ({
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
        useCallback(
            (state: any) => ({
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
        useCallback(
            (state: any) => ({
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

// Extended OBS data interface
interface ObsData {
    scenes: ObsScene[];
    currentProgramScene: string | null;
    sources: ObsSource[];
    streamStatus: StreamStatus;
    recordStatus: StreamStatus;
    videoSettings: VideoSettings;
}

// Memoized selector for OBS data to prevent unnecessary recalculations
export const useObsData = (): ObsData => {
    const connectionState = useConnectionState();
    
    // Get additional OBS data using properly typed selectors
    const scenes = useConnectionManagerStore(
        useCallback((state: ConnectionStoreState) => state.scenes, [])
    );
    const streamStatus = useConnectionManagerStore(
        useCallback((state: ConnectionStoreState) => state.streamStatus, [])
    );
    const recordStatus = useConnectionManagerStore(
        useCallback((state: ConnectionStoreState) => state.recordStatus, [])
    );
    const videoSettings = useConnectionManagerStore(
        useCallback((state: ConnectionStoreState) => state.videoSettings, [])
    );
    
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
export const usePerformanceMonitor = (componentName: string): void => {
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
export const shallowEqual = <T>(a: T, b: T): boolean => {
    if (a === b) return true;
    
    if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
        return false;
    }
    
    const keysA = Object.keys(a as Record<string, unknown>);
    const keysB = Object.keys(b as Record<string, unknown>);
    
    if (keysA.length !== keysB.length) return false;
    
    for (const key of keysA) {
        if (!keysB.includes(key) || (a as Record<string, unknown>)[key] !== (b as Record<string, unknown>)[key]) {
            return false;
        }
    }
    
    return true;
};

// Custom hook for optimized store subscriptions with shallow comparison
export const useShallowStore = <TState, TResult>(
    store: (selector: (state: TState) => TResult, equalityFn?: (a: TResult, b: TResult) => boolean) => TResult,
    selector: (state: TState) => TResult
): TResult => {
    return store(selector, shallowEqual);
};

// Combined connection actions and services selector
export const useConnectionActions = () => {
    return useConnectionManagerStore(
        useCallback(
            (state: ConnectionStoreState) => ({
                onRefreshData: state.onRefreshData,
                streamerBotServiceInstance: state.streamerBotServiceInstance,
                actions: state.actions,
            }),
            []
        )
    );
};
