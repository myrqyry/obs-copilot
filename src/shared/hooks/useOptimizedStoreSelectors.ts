import { useShallow } from 'zustand/react/shallow'; // Ensure this import exists
import useConnectionsStore from '@/app/store/connections';
import { useChatStore, ChatState } from '@/app/store/chatStore';
import useConfigStore, { ConfigState } from '@/app/store/configStore';
import { OBSData } from '@/shared/types';

/**
 * Optimized store selectors that combine multiple subscriptions
 * to reduce re-renders and improve performance
 */

// Basic pass-through (consider memoizing if expensive)
export const useConnectionState = () => {
    return useConnectionsStore();
};

// Combined chat state selector
export const useChatState = (): ChatState => {
    return useChatStore();
};

// Combined settings state selector
export const useSettings = (): ConfigState => {
    return useConfigStore();
};

// Optimized selector for OBS data using useShallow to prevent unnecessary re-renders
export const useObsData = (): OBSData => {
    return useConnectionsStore(
        useShallow((state) => ({
            scenes: state.scenes,
            currentProgramScene: state.currentScene, // Note: mapped from currentScene
            sources: state.sources,
            streamStatus: state.streaming ? { outputActive: true } : { outputActive: false }, // mapping simplistic based on store shape
            recordStatus: state.recording ? { outputActive: true } : { outputActive: false },
            videoSettings: null, // As per store implementation
        }))
    ) as unknown as OBSData; 
    // Casting used here to adapt the specific store shape to the generic OBSData interface
    // Ideally, the store shape should match OBSData exactly to avoid mapping logic inside the selector
};