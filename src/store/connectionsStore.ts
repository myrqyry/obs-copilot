import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ObsClientImpl, ObsError, ConnectionStatus } from '@/services/obsClient';
import type { OBSScene, OBSSource, OBSVideoSettings, OBSStreamStatus, OBSRecordStatus } from '@/types/obs';
import { StreamerBotService } from '@/services/streamerBotService';
import type { ConnectionProfile } from '@/types/connections';
import { StreamerBotError } from '@/types/streamerbot'; // Import StreamerBotError
import { toast } from '@/components/ui/toast';

// Helper function to sanitize OBS WebSocket URLs
const sanitizeOBSUrl = (input: string): { url: string; error?: string } => {
  if (!input || !input.trim()) {
    return { url: '', error: 'URL cannot be empty' };
  }

  try {
    let url = input.trim();

    // Ensure a protocol exists for the URL constructor
    if (!url.includes('://')) {
      url = `ws://${url}`;
    }

    // Convert HTTP(S) to WebSocket protocols
    url = url.replace(/^http:\/\//, 'ws://').replace(/^https:\/\//, 'wss://');

    const parsed = new URL(url);

    // Replace common dev server port with OBS default
    if (parsed.port === '5173') {
      parsed.port = '4455';
    }

    // Set default port for localhost or local IPs if not specified
    if (!parsed.port && (parsed.hostname === 'localhost' || parsed.hostname.startsWith('127.') || parsed.hostname.endsWith('.local'))) {
      parsed.port = '4455';
    }

    // Clean path, query, and fragment, as OBS connects to the root
    parsed.pathname = '/';
    parsed.search = '';
    parsed.hash = '';

    return { url: parsed.toString() };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { url: '', error: `Invalid WebSocket URL format: ${message}` };
  }
};


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
  editableSettings: OBSVideoSettings | null;

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
  cleanup: () => void; // Action to clean up all listeners

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

  // Settings actions
  setEditableSettings: (settings: OBSVideoSettings | null) => void;
  resetSettings: () => void;
}

const useConnectionsStore = create<ConnectionState>()(
  persist(
    (set, get) => {
      const obsClient = ObsClientImpl.getInstance();
      const streamerBotService = StreamerBotService.getInstance();
      const obsCleanupFunctions: (() => void)[] = [];
      
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

      const statusUnsub = obsClient.addStatusListener((status: ConnectionStatus) => {
        set({
          isConnected: status === 'connected',
          isLoading: status === 'connecting' || status === 'reconnecting',
          connectionError: status === 'error' ? 'Connection failed' : null,
        });
    
        if (status === 'connected') {
          console.log('[DEBUG] OBS connected, fetching initial data'); // Fetch start log
          // When connected (post-Identified), fetch initial data with error handling
          obsClient.getSceneList().then(({ scenes }) => set({ scenes })).catch(err => {
            console.log('[DEBUG] getSceneList rejected:', err);
            if (err instanceof ObsError && err.message.includes('Stale')) {
              console.log('[DEBUG] Ignoring stale getSceneList rejection');
            } else {
              console.error('[OBS] Failed to fetch scenes:', err);
            }
          });
          obsClient.getCurrentProgramScene().then(({ currentProgramSceneName }) => set({ currentProgramScene: currentProgramSceneName })).catch(err => {
            console.log('[DEBUG] getCurrentProgramScene rejected:', err);
            if (err instanceof ObsError && err.message.includes('Stale')) {
              console.log('[DEBUG] Ignoring stale getCurrentProgramScene rejection');
            } else {
              console.error('[OBS] Failed to fetch current scene:', err);
            }
          });
          obsClient.getInputList().then(({ inputs }) => {
            // Transform inputs to OBSSource format
            const sources = inputs.map((input: any) => ({
              sourceName: input.inputName,
              sourceKind: input.inputKind,
              ...input
            }));
            set({ sources });
          }).catch(err => {
            console.log('[DEBUG] getInputList rejected:', err);
            if (err instanceof ObsError && err.message.includes('Stale')) {
              console.log('[DEBUG] Ignoring stale getInputList rejection');
            } else {
              console.error('[OBS] Failed to fetch inputs:', err);
            }
          });
          obsClient.getStreamStatus().then((status) => set({ streamStatus: status as OBSStreamStatus })).catch(err => {
            console.log('[DEBUG] getStreamStatus rejected:', err);
            if (err instanceof ObsError && err.message.includes('Stale')) {
              console.log('[DEBUG] Ignoring stale getStreamStatus rejection');
            } else {
              console.error('[OBS] Failed to fetch stream status:', err);
            }
          });
          obsClient.getRecordStatus().then((status) => set({ recordStatus: status as OBSRecordStatus })).catch(err => {
            console.log('[DEBUG] getRecordStatus rejected:', err);
            if (err instanceof ObsError && err.message.includes('Stale')) {
              console.log('[DEBUG] Ignoring stale getRecordStatus rejection');
            } else {
              console.error('[OBS] Failed to fetch record status:', err);
            }
          });
          obsClient.getVideoSettings().then((settings) => set({ videoSettings: settings as OBSVideoSettings })).catch(err => {
            console.log('[DEBUG] getVideoSettings rejected:', err);
            if (err instanceof ObsError && err.message.includes('Stale')) {
              console.log('[DEBUG] Ignoring stale getVideoSettings rejection');
            } else {
              console.error('[OBS] Failed to fetch video settings:', err);
            }
          });
          console.log('[DEBUG] Initial data fetch promises created'); // Fetch end log
        }
      });
      obsCleanupFunctions.push(statusUnsub);

      // Event listeners for OBS updates
      obsCleanupFunctions.push(obsClient.on('SceneListChanged', ({ scenes }) => {
        set({ scenes });
      }));
      obsCleanupFunctions.push(obsClient.on('CurrentProgramSceneChanged', ({ sceneName }) => {
        set({ currentProgramScene: sceneName });
      }));
      obsCleanupFunctions.push(obsClient.on('StreamStateChanged', (data: OBSStreamStatus) => {
        set({ streamStatus: data });
      }));
      obsCleanupFunctions.push(obsClient.on('RecordStateChanged', (data: OBSRecordStatus) => {
        set({ recordStatus: data });
      }));

      const cleanup = () => {
        obsCleanupFunctions.forEach(fn => fn());
        obsCleanupFunctions.length = 0;
      };

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
        editableSettings: null,

        // Live Streamer.bot Connection State
        streamerBotServiceInstance: streamerBotService, // Pass the singleton instance
        isStreamerBotConnected: false,
        streamerBotConnectionError: null,
        isStreamerBotLoading: false,

        // Saved Connection Profiles Management
        connectionProfiles: [],
        activeConnectionId: null,
        cleanup,

        // Actions related to live connections
        connectToObs: async (url: string, password?: string) => {
          set({ isLoading: true, connectionError: null });

          const { url: sanitized, error: reason } = sanitizeOBSUrl(url);

          if (!sanitized) {
            const errorMsg = `Invalid OBS URL: ${reason}`;
            set({ isLoading: false, connectionError: errorMsg, isConnected: false });
            toast({
              title: "Connection Failed",
              description: errorMsg,
              variant: "destructive"
            });
            return;
          }
          if (sanitized !== url.trim()) {
            console.info(`[OBS] Sanitized URL from '${url}' to '${sanitized}'`);
            toast({
              title: "URL Sanitized",
              description: `Using corrected URL: ${sanitized}`,
              variant: "default"
            });
          }

          try {
            await obsClient.connect(sanitized, password);
            set({ isLoading: false, isConnected: true, connectionError: null });
          } catch (error: any) {
            const errorMsg = error instanceof ObsError ? error.message : `Connection failed: ${error.message || 'Unknown error'}`;
            set({ connectionError: errorMsg, isLoading: false, isConnected: false });
            toast({
              title: "OBS Connection Failed",
              description: errorMsg,
              variant: "destructive"
            });
          }
        },

        disconnectFromObs: async () => {
          await obsClient.disconnect();
          set({
            isConnected: false,
            connectionError: null,
            isLoading: false,
            streamStatus: null,
            recordStatus: null,
            videoSettings: null,
            activeConnectionId: null,
          });
        },

        // Explicitly clear persisted OBS data (scenes/sources) when the user requests it
        clearObsData: () => {
          set({
            scenes: [],
            currentProgramScene: null,
            sources: [],
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
          });
        },


        // Actions related to profile management
        addConnectionProfile: (profile: ConnectionProfile) => {
          set((state: ConnectionState) => ({
            connectionProfiles: [...state.connectionProfiles, profile],
          }));
        },

        updateConnectionProfile: (updatedProfile: ConnectionProfile) => {
          set((state: ConnectionState) => ({
            connectionProfiles: state.connectionProfiles.map((p: ConnectionProfile) =>
              p.id === updatedProfile.id ? updatedProfile : p
            ),
          }));
        },

        removeConnectionProfile: (id: string) => {
          set((state: ConnectionState) => ({
            connectionProfiles: state.connectionProfiles.filter((p: ConnectionProfile) => p.id !== id),
            activeConnectionId: state.activeConnectionId === id ? null : state.activeConnectionId,
          }));
        },

        clearAllProfiles: () => {
          set({ connectionProfiles: [], activeConnectionId: null });
        },

        setActiveConnectionId: (id: string | null) => {
          set({ activeConnectionId: id });
        },

        // Standard setters for current OBS status
        setScenes: (scenes: OBSScene[]) => set({ scenes }),
        setCurrentProgramScene: (sceneName: string | null) => set({ currentProgramScene: sceneName }),
        setSources: (sources: OBSSource[]) => set({ sources }),
        setStreamStatus: (status: OBSStreamStatus | null) => set({ streamStatus: status }),
        setRecordStatus: (status: OBSRecordStatus | null) => set({ recordStatus: status }),
        setVideoSettings: (settings: OBSVideoSettings | null) => set({ videoSettings: settings }),

        // Settings actions
        setEditableSettings: (settings: OBSVideoSettings | null) => set({ editableSettings: settings }),
        resetSettings: () => set({ editableSettings: null }),
       };
    },
    {
      name: 'connection-profiles-storage',
      storage: createJSONStorage(() => localStorage),
      // Persist last-known OBS scenes/sources to improve UX on reloads when OBS is disconnected
      partialize: (state) => ({
        connectionProfiles: state.connectionProfiles,
        activeConnectionId: state.activeConnectionId,
        scenes: state.scenes,
        sources: state.sources,
        currentProgramScene: state.currentProgramScene,
        editableSettings: state.editableSettings,
      }),
      version: 1,
      // No rehydration logic here; components should re-connect based on activeConnectionId
    }
  )
);

// Selector hook for optimized re-renders
export const createConnectionSelectors = () => ({
  isConnected: (state: ConnectionState) => state.isConnected,
  isLoading: (state: ConnectionState) => state.isLoading,
  connectionError: (state: ConnectionState) => state.connectionError,
  scenes: (state: ConnectionState) => state.scenes,
  currentProgramScene: (state: ConnectionState) => state.currentProgramScene,
  sources: (state: ConnectionState) => state.sources,
  streamStatus: (state: ConnectionState) => state.streamStatus,
  recordStatus: (state: ConnectionState) => state.recordStatus,
  videoSettings: (state: ConnectionState) => state.videoSettings,
  isStreamerBotConnected: (state: ConnectionState) => state.isStreamerBotConnected,
  streamerBotConnectionError: (state: ConnectionState) => state.streamerBotConnectionError,
  activeConnectionId: (state: ConnectionState) => state.activeConnectionId,
  connectionProfiles: (state: ConnectionState) => state.connectionProfiles,
});

export default useConnectionsStore;