import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { ObsClientImpl, ConnectionStatus } from '@/services/obsClient';
import type { OBSScene, OBSSource, OBSVideoSettings, OBSStreamStatus, OBSRecordStatus } from '@/types/obs';
import { StreamerBotService } from '@/services/streamerBotService';
import type { ConnectionProfile, ObsConnectionProfile, StreamerbotConnectionProfile, ConnectionType } from '@/types/connections';
import { StreamerBotError } from '@/types/streamerbot'; // Import StreamerBotError

// Combined state for live connections and saved profiles
export interface ConnectionState {
  // Live OBS Connection State
  obs: ObsClientImpl | null;
  isConnected: boolean;
  connectionError: string | null;
  isLoading: boolean;
  scenes: OBSScene[];
  currentProgramScene: string | null;
  sources: OBSSource[];
  streamStatus: OBSStreamStatus | null;
  recordStatus: OBSRecordStatus | null;
  videoSettings: OBSVideoSettings | null;

  // Live Streamer.bot Connection State
  streamerBotServiceInstance: StreamerBotService | null;
  isStreamerBotConnected: boolean;
  streamerBotConnectionError: string | null;
  isStreamerBotLoading: boolean;


  // Saved Connection Profiles Management
  connectionProfiles: ConnectionProfile[];
  activeConnectionId: string | null; // ID of the currently active connection (could be OBS or Streamer.bot)

  // Actions related to live connections
  connectToObs: (url: string, password?: string) => Promise<void>;
  disconnectFromObs: () => Promise<void>;
  connectToStreamerBot: (host: string, port: number) => Promise<void>;
  disconnectFromStreamerBot: () => Promise<void>;

  // Actions related to profile management
  addConnectionProfile: (profile: ConnectionProfile) => void;
  updateConnectionProfile: (profile: ConnectionProfile) => void;
  removeConnectionProfile: (id: string) => void;
  clearAllProfiles: () => void;
  setActiveConnectionId: (id: string | null) => void;

  // Standard setters for current OBS status
  setScenes: (scenes: OBSScene[]) => void;
  setCurrentProgramScene: (sceneName: string | null) => void;
  setSources: (sources: OBSSource[]) => void;
  setStreamStatus: (status: OBSStreamStatus | null) => void;
  setRecordStatus: (status: OBSRecordStatus | null) => void;
  setVideoSettings: (settings: OBSVideoSettings | null) => void;
}

const useConnectionsStore = create<ConnectionState>()(
  persist(
    (set, get) => {
      const obsClient = ObsClientImpl.getInstance();
      const streamerBotService = StreamerBotService.getInstance(); 
      
      const setupStreamerBotListeners = () => {
        streamerBotService.setLifecycleCallbacks({
          onConnect: () => {
            set({ isStreamerBotConnected: true, isStreamerBotLoading: false, streamerBotConnectionError: null });
          },
          onDisconnect: (code?: number, reason?: string) => {
            set({ isStreamerBotConnected: false, isStreamerBotLoading: false, streamerBotConnectionError: `Disconnected: ${reason || code}` });
          },
          onError: (err: StreamerBotError) => {
            set({ isStreamerBotConnected: false, isStreamerBotLoading: false, streamerBotConnectionError: err.message });
          },
        });
      };

      // Set up listeners immediately
      setupStreamerBotListeners();

      obsClient.addStatusListener((status: ConnectionStatus) => {
        set({
          isConnected: status === 'connected',
          isLoading: status === 'connecting' || status === 'reconnecting',
          connectionError: status === 'error' ? 'Connection failed' : null,
        });

        if (status === 'connected') {
          // When connected, fetch initial data
          obsClient.getSceneList().then(({ scenes }) => set({ scenes }));
          obsClient.getCurrentProgramScene().then(({ currentProgramSceneName }) => set({ currentProgramScene: currentProgramSceneName }));
          obsClient.getStreamStatus().then((status) => set({ streamStatus: status as OBSStreamStatus }));
          obsClient.getRecordStatus().then((status) => set({ recordStatus: status as OBSRecordStatus }));
          obsClient.getVideoSettings().then((settings) => set({ videoSettings: settings as OBSVideoSettings }));
        }
      });

      // Event listeners for OBS updates
      obsClient.on('SceneListChanged', ({ scenes }) => {
        set({ scenes });
      });
      obsClient.on('CurrentProgramSceneChanged', ({ sceneName }) => {
        set({ currentProgramScene: sceneName });
        obsClient.getSceneItemList(sceneName).then(({ sceneItems }) => {
          set({ sources: sceneItems });
        });
      });
      obsClient.on('StreamStateChanged', (data: OBSStreamStatus) => {
        set({ streamStatus: data });
      });
      obsClient.on('RecordStateChanged', (data: OBSRecordStatus) => {
        set({ recordStatus: data });
      });

      return {
        // Live OBS Connection State
        obs: obsClient,
        isConnected: false,
        connectionError: null,
        isLoading: false,
        scenes: [],
        currentProgramScene: null,
        sources: [],
        streamStatus: null,
        recordStatus: null,
        videoSettings: null,

        // Live Streamer.bot Connection State
        streamerBotServiceInstance: streamerBotService, // Pass the singleton instance
        isStreamerBotConnected: false,
        streamerBotConnectionError: null,
        isStreamerBotLoading: false,

        // Saved Connection Profiles Management
        connectionProfiles: [],
        activeConnectionId: null,

        // Actions related to live connections
        connectToObs: async (url, password) => {
          set({ isLoading: true, connectionError: null });
          try {
            await obsClient.connect(url, password);
            // After successful connection, potentially update activeConnectionId if linked to a saved profile
            set({ isLoading: false, isConnected: true /* activeConnectionId: ... */ });
          } catch (error: any) {
            set({ connectionError: error.message, isLoading: false, isConnected: false });
          }
        },

        disconnectFromObs: async () => {
          await obsClient.disconnect();
          set({
            isConnected: false,
            connectionError: null,
            isLoading: false,
            scenes: [],
            currentProgramScene: null,
            sources: [],
            streamStatus: null,
            recordStatus: null,
            videoSettings: null,
            activeConnectionId: null,
          });
        },

        connectToStreamerBot: async (host: string, port: number) => {
          set({ isStreamerBotLoading: true, streamerBotConnectionError: null });
          try {
            await streamerBotService.connect(host, port);
          } catch (error: any) {
            set({ streamerBotConnectionError: error.message, isStreamerBotLoading: false, isStreamerBotConnected: false });
          }
        },

        disconnectFromStreamerBot: async () => {
          await streamerBotService.disconnect();
          set({
            isStreamerBotConnected: false,
            streamerBotConnectionError: null,
            isStreamerBotLoading: false,
            // activeConnectionId will be set to null if the disconnected profile was active
          });
        },


        // Actions related to profile management
        addConnectionProfile: (profile: ConnectionProfile) => {
          set((state) => ({
            connectionProfiles: [...state.connectionProfiles, profile],
          }));
        },

        updateConnectionProfile: (updatedProfile) => {
          set((state) => ({
            connectionProfiles: state.connectionProfiles.map((p) =>
              p.id === updatedProfile.id ? updatedProfile : p
            ),
          }));
        },

        removeConnectionProfile: (id) => {
          set((state) => ({
            connectionProfiles: state.connectionProfiles.filter((p) => p.id !== id),
            activeConnectionId: state.activeConnectionId === id ? null : state.activeConnectionId,
          }));
        },

        clearAllProfiles: () => {
          set({ connectionProfiles: [], activeConnectionId: null });
        },

        setActiveConnectionId: (id) => {
          set({ activeConnectionId: id });
        },

        // Standard setters for current OBS status
        setScenes: (scenes) => set({ scenes }),
        setCurrentProgramScene: (sceneName) => set({ currentProgramScene: sceneName }),
        setSources: (sources) => set({ sources }),
        setStreamStatus: (status: OBSStreamStatus | null) => set({ streamStatus: status }),
        setRecordStatus: (status: OBSRecordStatus | null) => set({ recordStatus: status }),
        setVideoSettings: (settings: OBSVideoSettings | null) => set({ videoSettings: settings }),
      };
    },
    {
      name: 'connection-profiles-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        connectionProfiles: state.connectionProfiles,
        activeConnectionId: state.activeConnectionId,
      }),
      version: 1,
      // No rehydration logic here; components should re-connect based on activeConnectionId
    },
  ),
);

export default useConnectionsStore;