import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ObsClientImpl, ConnectionStatus, ObsError } from '@/services/obsClient';
import type { OBSScene, OBSSource, OBSVideoSettings, OBSStreamStatus, OBSRecordStatus } from '@/types/obs';
import { StreamerBotService } from '@/services/streamerBotService';
import type { ConnectionProfile } from '@/types/connections';
import { StreamerBotError } from '@/types/streamerbot'; // Import StreamerBotError
import { toast } from '@/components/ui/toast';

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
  (set) => {
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

      // Event listeners for OBS updates
      obsClient.on('SceneListChanged', ({ scenes }) => {
        set({ scenes });
      });
      obsClient.on('CurrentProgramSceneChanged', ({ sceneName }) => {
        set({ currentProgramScene: sceneName });
        // Note: Don't overwrite the global sources list with scene items
        // Scene items are different from sources - they're instances of sources in a scene
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

          const sanitize = (raw: string): { url: string | null; reason?: string } => {
            let input = raw.trim();
            if (!input) return { url: null, reason: 'Empty URL' };

            // If user pasted something like current page location + path (dev server), strip everything
            // Examples of bad inputs seen: ws://localhost:5173/myrqyry , ws://localhost:5173/192.1....
            // Strategy: parse, keep only scheme, host, port; enforce port != 5173; default port 4455 if host is localhost and no port.
            // Accept forms: ws(s)://host[:port] , http(s)://host[:port] , host[:port]
            try {
              if (/^localhost$/i.test(input)) input = 'ws://localhost:4455';
              else if (/^[^/:]+:\d+$/.test(input)) input = 'ws://' + input; // bare host:port
              else if (/^[\w.-]+$/.test(input)) input = 'ws://' + input; // bare hostname

              if (input.startsWith('http://')) input = 'ws://' + input.slice(7);
              else if (input.startsWith('https://')) input = 'wss://' + input.slice(8);

              if (!input.startsWith('ws://') && !input.startsWith('wss://')) {
                // Fallback: assume ws://
                input = 'ws://' + input.replace(/^\/*/, '');
              }

              const u = new URL(input);

              // If dev server port or page origin port used -> replace with 4455 (OBS default)
              if (u.port === '5173') {
                u.port = '4455';
              }

              // Remove any path/query/hash (OBS websocket root only) - STRICT: reject if original had non-root path
              if (u.pathname !== '/') {
                // Check if original input had path; if so, reject as invalid for WebSocket
                if (raw.includes('/') && !raw.match(/^ws[s]?:\/\//)) {
                  return { url: null, reason: 'Invalid WebSocket URL: paths not allowed (e.g., no "/myrqyry/")' };
                }
                u.pathname = '/';
              }
              u.search = '';
              u.hash = '';

              // If no explicit port, set default 4455 for localhost or 4455 if host looks local (ends with .local or is 127.*)
              if (!u.port) {
                if (u.hostname === 'localhost' || /^127\./.test(u.hostname)) {
                  u.port = '4455';
                }
              }

              // Enhanced validation: host must be valid hostname or IPv4
              const ipv4Re = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
              const hostnameRe = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/; // Standard hostname regex
              
              // Allow common valid hostnames
              const isValidHostname = ipv4Re.test(u.hostname) || 
                                    hostnameRe.test(u.hostname) || 
                                    u.hostname === 'localhost' || 
                                    u.hostname.endsWith('.local');
              
              if (!isValidHostname) {
                return { url: null, reason: 'Invalid host: must be valid hostname/IP (e.g., localhost, 127.0.0.1, example.com)' };
              }

              return { url: u.toString() };
            } catch (e) {
              return { url: null, reason: 'Malformed URL' };
            }
          };

          const { url: sanitized, reason } = sanitize(url);
          if (!sanitized) {
            console.log('[DEBUG] Sanitize failed:', { input: url, reason }); // Validation log
            set({ isLoading: false, connectionError: `Invalid OBS URL: ${reason}`, isConnected: false });
            toast({
              title: "Connection Failed",
              description: `Invalid OBS URL: ${reason}`,
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
          console.log('[DEBUG] Sanitized URL parsed:', { hostname: new URL(sanitized).hostname, pathname: new URL(sanitized).pathname }); // URL parsing log

          try {
            await obsClient.connect(sanitized, password);
            set({ isLoading: false, isConnected: true, connectionError: null });
          } catch (error: any) {
            console.log('[DEBUG] ObsError instanceof check:', { errorName: error?.name, isObsError: error instanceof ObsError }); // ObsError check log
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
          // On refresh/unmount we don't want to erase the last-known scenes/sources
          // so the UI can still show them. Provide an explicit clear action below
          // if the user intentionally wants to remove persisted OBS data.
          await obsClient.disconnect();
          set({
            isConnected: false,
            connectionError: null,
            isLoading: false,
            // keep scenes/sources/currentProgramScene intact to preserve last-known values
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
      // Persist last-known OBS scenes/sources to improve UX on reloads when OBS is disconnected
      partialize: (state) => ({
        connectionProfiles: state.connectionProfiles,
        activeConnectionId: state.activeConnectionId,
        scenes: state.scenes,
        sources: state.sources,
        currentProgramScene: state.currentProgramScene,
      }),
      version: 1,
      // No rehydration logic here; components should re-connect based on activeConnectionId
    },
  ),
);

export default useConnectionsStore;