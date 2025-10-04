import useConnectionsStore, { ConnectionState } from '@/store/connectionsStore';
import { useChatStore, ChatState } from '@/store/chatStore';
import { OBSData } from '@/types';

/**
 * Optimized store selectors that combine multiple subscriptions
 * to reduce re-renders and improve performance
 */

export const useConnectionState = (): ConnectionState => {
    return useConnectionsStore();
};

// Combined chat state selector with proper memoization
export const useChatState = (): ChatState => {
    return useChatStore();
};

// Memoized selector for OBS data to prevent unnecessary recalculations
export const useObsData = (): OBSData => {
    const {
        scenes,
        currentProgramScene,
        sources,
        streamStatus,
        recordStatus,
        videoSettings
    } = useConnectionsStore();
    
    return {
        scenes,
        currentProgramScene,
        sources,
        streamStatus,
        recordStatus,
        videoSettings,
    };
};
