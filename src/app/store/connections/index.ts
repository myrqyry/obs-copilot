import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useOBSConnectionStore, OBSConnectionState } from './obsConnectionStore';
import { createStreamerBotConnectionSlice, StreamerBotConnectionState } from './streamerBotConnectionStore';
import { createConnectionProfilesSlice, ConnectionProfilesState } from './connectionProfilesStore';
import { createBackendConnectionSlice, BackendConnectionState } from './backendConnectionStore';

type CombinedState = OBSConnectionState & StreamerBotConnectionState & ConnectionProfilesState & BackendConnectionState;

export const useConnectionsStore = create<CombinedState>()(
  persist(
    (...args) => ({
      ...useOBSConnectionStore.getState(),
      ...createStreamerBotConnectionSlice(...args),
      ...createConnectionProfilesSlice(...args),
      ...createBackendConnectionSlice(...args),
      /**
       * Connect to OBS using obsClient and update store state
       */
      connectToObs: async (address: string, password?: string) => {
        const { setConnected, setConnecting, setError } = useOBSConnectionStore.getState();
        setConnecting(true);
        setError(null);
        try {
          // obsClient is a singleton
          const { obsClient } = await import('@/shared/services/obsClient');
          await obsClient.connect(address, password);
          setConnected(true);
          setConnecting(false);
          setError(null);
        } catch (err: any) {
          setConnected(false);
          setConnecting(false);
          setError(err?.message || 'Failed to connect to OBS');
        }
      },
    }),
    {
      name: 'connection-profiles-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        connectionProfiles: state.connectionProfiles,
        activeConnectionId: state.activeConnectionId,
      }),
      version: 1,
    }
  )
);

export const createConnectionSelectors = () => ({
  obsStatus: (state: CombinedState) => state.connected ? 'connected' : 'disconnected',
  isConnected: (state: CombinedState) => state.connected,
  isLoading: (state: CombinedState) => state.connecting,
  connectionError: (state: CombinedState) => state.error,
  scenes: (state: CombinedState) => state.scenes,
  currentProgramScene: (state: CombinedState) => state.currentScene,
  sources: (state: CombinedState) => state.sources,
  streamStatus: (state: CombinedState) => state.streaming,
  recordStatus: (state: CombinedState) => state.recording,
  videoSettings: (state: CombinedState) => null, // This is not in the new store, so I'll set it to null
  isStreamerBotConnected: (state: CombinedState) => state.isStreamerBotConnected,
  streamerBotConnectionError: (state: CombinedState) => state.streamerBotConnectionError,
  activeConnectionId: (state: CombinedState) => state.activeConnectionId,
  connectionProfiles: (state: CombinedState) => state.connectionProfiles,
  backendStatus: (state: CombinedState) => state.backendStatus,
  backendError: (state: CombinedState) => state.backendError,
  backendLastChecked: (state: CombinedState) => state.backendLastChecked,
});

export default useConnectionsStore;