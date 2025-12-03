import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createObsConnectionSlice, ObsConnectionState } from './obsConnectionStore';
import { createStreamerBotConnectionSlice, StreamerBotConnectionState } from './streamerBotConnectionStore';
import { createConnectionProfilesSlice, ConnectionProfilesState } from './connectionProfilesStore';
import { createBackendConnectionSlice, BackendConnectionState } from './backendConnectionStore';

type CombinedState = ObsConnectionState & StreamerBotConnectionState & ConnectionProfilesState & BackendConnectionState;

export const useConnectionsStore = create<CombinedState>()(
  persist(
    (...args) => ({
      ...createObsConnectionSlice(...args),
      ...createStreamerBotConnectionSlice(...args),
      ...createConnectionProfilesSlice(...args),
      ...createBackendConnectionSlice(...args),
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
  obsStatus: (state: CombinedState) => state.obsStatus,
  isConnected: (state: CombinedState) => state.obsStatus === 'connected',
  isLoading: (state: CombinedState) => state.obsStatus === 'connecting' || state.obsStatus === 'reconnecting', // Note: reconnecting is not in ConnectionStatus type in obsClient, but used in UI
  connectionError: (state: CombinedState) => state.connectionError,
  scenes: (state: CombinedState) => state.scenes,
  currentProgramScene: (state: CombinedState) => state.currentProgramScene,
  sources: (state: CombinedState) => state.sources,
  streamStatus: (state: CombinedState) => state.streamStatus,
  recordStatus: (state: CombinedState) => state.recordStatus,
  videoSettings: (state: CombinedState) => state.videoSettings,
  isStreamerBotConnected: (state: CombinedState) => state.isStreamerBotConnected,
  streamerBotConnectionError: (state: CombinedState) => state.streamerBotConnectionError,
  activeConnectionId: (state: CombinedState) => state.activeConnectionId,
  connectionProfiles: (state: CombinedState) => state.connectionProfiles,
  backendStatus: (state: CombinedState) => state.backendStatus,
  backendError: (state: CombinedState) => state.backendError,
  backendLastChecked: (state: CombinedState) => state.backendLastChecked,
});

export default useConnectionsStore;