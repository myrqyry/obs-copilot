import { useMemo, useCallback } from 'react';
import useConnectionsStore from '@/store/connectionsStore';
import { useChatStore } from '@/store/chatStore';
import { useSettingsStore } from '@/store/settingsStore';
import { ChatMessage } from '@/types';

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
    addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
    replaceMessage: (messageId: string, newMessage: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
    setGeminiClientInitialized: (initialized: boolean) => void;
    addToUserDefinedContext: (context: string) => void;
    removeFromUserDefinedContext: (context: string) => void;
    clearUserDefinedContext: () => void;
    addSystemMessageToChat: (contextText: string) => void;
    setGlobalErrorMessage: (message: string | null) => void;
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
    return useConnectionsStore(
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

// Memoize the selector function to prevent recreation on each render
const chatStateSelector = (state: any): ChatState => {
    const messages = state.geminiMessages || [];
    const isGeminiClientInitialized = state.isGeminiClientInitialized || false;
    const actions: ChatActions = state.actions || {};

    // Convert ChatMessage to GeminiMessage format
    const geminiMessages = messages.map((msg: { 
        id: string; 
        role: string; 
        text: string; 
        timestamp?: Date; 
        sources?: any[];
    }) => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.text,
        timestamp: msg.timestamp?.getTime?.() || Date.now(),
        metadata: msg.sources ? { sources: msg.sources } : undefined,
    }));

    return {
        messages: geminiMessages,
        isGeminiClientInitialized,
        actions,
    };
};

// Combined chat state selector with proper memoization
export const useChatState = (): ChatState => {
    return useChatStore(chatStateSelector);
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
    const scenes = useConnectionsStore(
        useCallback((state: ConnectionStoreState) => state.scenes, [])
    );
    const streamStatus = useConnectionsStore(
        useCallback((state: ConnectionStoreState) => state.streamStatus, [])
    );
    const recordStatus = useConnectionsStore(
        useCallback((state: ConnectionStoreState) => state.recordStatus, [])
    );
    const videoSettings = useConnectionsStore(
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

export const useOnRefreshData = (): (() => void | Promise<void>) | undefined => {
    return useConnectionsStore(
        useCallback((state: ConnectionStoreState) => state.onRefreshData, [])
    );
};

export const useStreamerBotServiceInstance = (): any => {
    return useConnectionsStore(
        useCallback((state: ConnectionStoreState) => state.streamerBotServiceInstance, [])
    );
};

export const useConnectionActions = (): any => {
    return useConnectionsStore(
        useCallback((state: ConnectionStoreState) => state.actions, [])
    );
};
