import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { connectionManager } from '@/services/ConnectionManager';
import { ObsClientImpl, ObsError, ConnectionStatus } from '@/services/obsClient';
import type { OBSScene, OBSSource, OBSVideoSettings, OBSStreamStatus, OBSRecordStatus } from '@/types/obs';
import { StreamerBotService } from '@/services/streamerBotService';
import type { ConnectionProfile } from '@/types/connections';
import { StreamerBotError } from '@/types/streamerbot';
import { toast } from '@/components/ui/toast';

// Helper function to sanitize OBS WebSocket URLs
const sanitizeOBSUrl = (input: string): { url: string; error?: string } => {
  if (!input || !input.trim()) {
    return { url: '', error: 'URL cannot be empty' };
  }

  try {
    let url = input.trim();

    if (!url.includes('://')) {
      url = `ws://${url}`;
    }

    url = url.replace(/^http:\/\//, 'ws://').replace(/^https:\/\//, 'wss://');

    const parsed = new URL(url);

    if (parsed.port === '5173') {
      parsed.port = '4455';
    }

    if (!parsed.port && (parsed.hostname === 'localhost' || parsed.hostname.startsWith('127.') || parsed.hostname.endsWith('.local'))) {
      parsed.port = '4455';
    }

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
  obsStatus: ConnectionStatus;
  connectionError: string | null;
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
  activeConnectionId: string | null;

  // Actions related to live connections
  connectToObs: (url: string, password?: string) => Promise<void>;
  disconnectFromObs: () => Promise<void>;
  connectToStreamerBot: (host: string, port: number) => Promise<void>;
  disconnectFromStreamerBot: () => Promise<void>;
  cleanup: () => void;

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
      const obsClient = connectionManager.getObsConnection('default')!;
      const streamerBotService = connectionManager.getStreamerBotConnection('default')!;
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

      setupStreamerBotListeners();

      const statusUnsub = obsClient.addStatusListener((status: ConnectionStatus) => {
        set({
          obsStatus: status,
          connectionError: status === 'error' ? 'Connection failed' : null,
        });
    
        if (status === 'connected') {
          obsClient.getSceneList().then(({ scenes }) => set({ scenes })).catch(err => {
            if (!(err instanceof ObsError && err.message.includes('Stale'))) {
              console.error('[OBS] Failed to fetch scenes:', err);
            }
          });
          obsClient.getCurrentProgramScene().then(({ currentProgramSceneName }) => set({ currentProgramScene: currentProgramSceneName })).catch(err => {
            if (!(err instanceof ObsError && err.message.includes('Stale'))) {
              console.error('[OBS] Failed to fetch current scene:', err);
            }
          });
          obsClient.getInputList().then(({ inputs }) => {
            const sources = inputs.map((input: any) => ({
              sourceName: input.inputName,
              sourceKind: input.inputKind,
              ...input
            }));
            set({ sources });
          }).catch(err => {
            if (!(err instanceof ObsError && err.message.includes('Stale'))) {
              console.error('[OBS] Failed to fetch inputs:', err);
            }
          });
          obsClient.getStreamStatus().then((status) => set({ streamStatus: status as OBSStreamStatus })).catch(err => {
            if (!(err instanceof ObsError && err.message.includes('Stale'))) {
              console.error('[OBS] Failed to fetch stream status:', err);
            }
          });
          obsClient.getRecordStatus().then((status) => set({ recordStatus: status as OBSRecordStatus })).catch(err => {
            if (!(err instanceof ObsError && err.message.includes('Stale'))) {
              console.error('[OBS] Failed to fetch record status:', err);
            }
          });
          obsClient.getVideoSettings().then((settings) => set({ videoSettings: settings as OBSVideoSettings })).catch(err => {
            if (!(err instanceof ObsError && err.message.includes('Stale'))) {
              console.error('[OBS] Failed to fetch video settings:', err);
            }
          });
        }
      });
      obsCleanupFunctions.push(statusUnsub);

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
        obs: obsClient,
        obsStatus: 'disconnected',
        connectionError: null,
        scenes: [],
        currentProgramScene: null,
        sources: [],
        streamStatus: null,
        recordStatus: null,
        videoSettings: null,
        editableSettings: null,

        streamerBotServiceInstance: streamerBotService,
        isStreamerBotConnected: false,
        streamerBotConnectionError: null,
        isStreamerBotLoading: false,

        connectionProfiles: [],
        activeConnectionId: null,
        cleanup,

        connectToObs: async (url: string, password?: string) => {
          set({ obsStatus: 'connecting', connectionError: null });

          const { url: sanitized, error: reason } = sanitizeOBSUrl(url);

          if (!sanitized) {
            const errorMsg = `Invalid OBS URL: ${reason}`;
            set({ obsStatus: 'error', connectionError: errorMsg });
            toast({
              title: "Connection Failed",
              description: errorMsg,
              variant: "destructive"
            });
            return;
          }
          if (sanitized !== url.trim()) {
            toast({
              title: "URL Sanitized",
              description: `Using corrected URL: ${sanitized}`,
              variant: "default"
            });
          }

          try {
            await obsClient.connect(sanitized, password);
            // The status will be updated by the listener, so we don't set it here.
          } catch (error: any) {
            const errorMsg = error instanceof ObsError ? error.message : `Connection failed: ${error.message || 'Unknown error'}`;
            set({ obsStatus: 'error', connectionError: errorMsg });
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
            obsStatus: 'disconnected',
            connectionError: null,
            streamStatus: null,
            recordStatus: null,
            videoSettings: null,
            activeConnectionId: null,
          });
        },

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

        setScenes: (scenes: OBSScene[]) => set({ scenes }),
        setCurrentProgramScene: (sceneName: string | null) => set({ currentProgramScene: sceneName }),
        setSources: (sources: OBSSource[]) => set({ sources }),
        setStreamStatus: (status: OBSStreamStatus | null) => set({ streamStatus: status }),
        setRecordStatus: (status: OBSRecordStatus | null) => set({ recordStatus: status }),
        setVideoSettings: (settings: OBSVideoSettings | null) => set({ videoSettings: settings }),

        setEditableSettings: (settings: OBSVideoSettings | null) => set({ editableSettings: settings }),
        resetSettings: () => set({ editableSettings: null }),
       };
    },
    {
      name: 'connection-profiles-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        connectionProfiles: state.connectionProfiles,
        activeConnectionId: state.activeConnectionId,
        scenes: state.scenes,
        sources: state.sources,
        currentProgramScene: state.currentProgramScene,
        editableSettings: state.editableSettings,
      }),
      version: 1,
    }
  )
);

export const createConnectionSelectors = () => ({
  obsStatus: (state: ConnectionState) => state.obsStatus,
  isConnected: (state: ConnectionState) => state.obsStatus === 'connected',
  isLoading: (state: ConnectionState) => state.obsStatus === 'connecting' || state.obsStatus === 'reconnecting',
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