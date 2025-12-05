import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { StateCreator } from 'zustand';
import { ObsClientImpl, ObsError, ConnectionStatus } from '@/services/obsClient';
import type { OBSScene, OBSSource, OBSVideoSettings, OBSStreamStatus, OBSRecordStatus } from '@/types/obs';
import { toast } from '@/components/ui/toast';
import { connectionManager } from '@/services/ConnectionManager';
import { createErrorHandler } from '@/utils/errorHandler';
import { appConfig } from '@/config/appConfig';

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
      parsed.port = String(appConfig.obs.defaultPort);
    }

    if (!parsed.port && (parsed.hostname === 'localhost' || parsed.hostname.startsWith('127.') || parsed.hostname.endsWith('.local'))) {
      parsed.port = String(appConfig.obs.defaultPort);
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

export interface ObsConnectionState {
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
  connectToObs: (url: string, password?: string) => Promise<void>;
  disconnectFromObs: () => Promise<void>;
  cleanupObsListeners: () => void;
  setScenes: (scenes: OBSScene[]) => void;
  setCurrentProgramScene: (sceneName: string | null) => void;
  setSources: (sources: OBSSource[]) => void;
  setStreamStatus: (status: OBSStreamStatus | null) => void;
  setRecordStatus: (status: OBSRecordStatus | null) => void;
  setVideoSettings: (settings: OBSVideoSettings | null) => void;
  setEditableSettings: (settings: OBSVideoSettings | null) => void;
  resetSettings: () => void;
}

const computeActiveScene = (state: ObsConnectionState): OBSScene | undefined =>
  state.scenes.find(s => s.sceneName === state.currentProgramScene);

const computeIsStreaming = (state: ObsConnectionState): boolean =>
  state.streamStatus?.outputActive ?? false;

export const createObsConnectionSlice: StateCreator<
  ObsConnectionState,
  [['zustand/devtools', never], ['zustand/persist', unknown], ['zustand/immer', never]],
  [],
  ObsConnectionState
> = (set) => {
  const obsClient = connectionManager.getObsConnection('default')!;
  const obsCleanupFunctions: (() => void)[] = [];

  const statusUnsub = obsClient.addStatusListener((status: ConnectionStatus) => {
    set(state => {
      state.obsStatus = status;
      state.connectionError = status === 'error' ? 'Connection failed' : null;
    });

    if (status === 'connected') {
      Promise.all([
        obsClient.getSceneList(),
        obsClient.getCurrentProgramScene(),
        obsClient.getInputList(),
        obsClient.getStreamStatus(),
        obsClient.getRecordStatus(),
        obsClient.getVideoSettings(),
      ]).then(([scenes, currentProgramScene, inputs, streamStatus, recordStatus, videoSettings]) => {
        const sources = inputs.inputs.map((input: any) => ({
          sourceName: input.inputName,
          sourceKind: input.inputKind,
          ...input
        }));
        set(state => {
          state.scenes = scenes.scenes;
          state.currentProgramScene = currentProgramScene.currentProgramSceneName;
          state.sources = sources;
          state.streamStatus = streamStatus as OBSStreamStatus;
          state.recordStatus = recordStatus as OBSRecordStatus;
          state.videoSettings = videoSettings as OBSVideoSettings;
        });
      }).catch(err => {
        if (!(err instanceof ObsError && err.message.includes('Stale'))) {
          console.error('[OBS] Failed to fetch initial state:', err);
        }
      });
    }
  });
  obsCleanupFunctions.push(statusUnsub);

  obsCleanupFunctions.push(obsClient.on('SceneListChanged', ({ scenes }) => {
    set(state => { state.scenes = scenes; });
  }));
  obsCleanupFunctions.push(obsClient.on('CurrentProgramSceneChanged', ({ sceneName }) => {
    set(state => { state.currentProgramScene = sceneName; });
  }));
  obsCleanupFunctions.push(obsClient.on('StreamStateChanged', (data: OBSStreamStatus) => {
    set(state => { state.streamStatus = data; });
  }));
  obsCleanupFunctions.push(obsClient.on('RecordStateChanged', (data: OBSRecordStatus) => {
    set(state => { state.recordStatus = data; });
  }));

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

    cleanupObsListeners: () => {
      try {
        obsCleanupFunctions.forEach(fn => {
          try {
            fn();
          } catch (error) {
            console.warn('Error during listener cleanup:', error);
          }
        });
      } finally {
        obsCleanupFunctions.length = 0;
      }
    },

    connectToObs: async (url: string, password?: string) => {
      set(state => {
        state.obsStatus = 'connecting';
        state.connectionError = null;
      });

      const { url: sanitized, error: reason } = sanitizeOBSUrl(url);

      if (!sanitized) {
        const errorMsg = `Invalid OBS URL: ${reason}`;
        set(state => {
          state.obsStatus = 'error';
          state.connectionError = errorMsg;
        });
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

      const errorHandler = createErrorHandler('OBS Connection');
      try {
        await obsClient.connect(sanitized, password);
      } catch (error) {
        const appError = errorHandler.handle(error, 'Unable to connect to OBS Studio');
        set(state => {
          state.obsStatus = 'error';
          state.connectionError = appError.userMessage || null;
        });

        toast({
          title: "Connection Failed",
          description: appError.userMessage,
          variant: "destructive"
        });
      }
    },

    disconnectFromObs: async () => {
      await obsClient.disconnect();
      set(state => {
        state.obsStatus = 'disconnected';
        state.connectionError = null;
        state.streamStatus = null;
        state.recordStatus = null;
        state.videoSettings = null;
      });
    },

    setScenes: (scenes: OBSScene[]) => set(state => { state.scenes = scenes; }),
    setCurrentProgramScene: (sceneName: string | null) => set(state => { state.currentProgramScene = sceneName; }),
    setSources: (sources: OBSSource[]) => set(state => { state.sources = sources; }),
    setStreamStatus: (status: OBSStreamStatus | null) => set(state => { state.streamStatus = status; }),
    setRecordStatus: (status: OBSRecordStatus | null) => set(state => { state.recordStatus = status; }),
    setVideoSettings: (settings: OBSVideoSettings | null) => set(state => { state.videoSettings = settings; }),

    setEditableSettings: (settings: OBSVideoSettings | null) => set(state => { state.editableSettings = settings; }),
    resetSettings: () => set(state => { state.editableSettings = null; }),
  };
};

const useObsStore = create<ObsConnectionState>()(
  devtools(
    persist(
      immer(createObsConnectionSlice),
      {
        name: 'obs-store',
        partialize: (state) => ({
          scenes: state.scenes,
          currentProgramScene: state.currentProgramScene,
        }),
      }
    ),
    { name: 'OBS Store' }
  )
);

export const useActiveScene = () => useObsStore(computeActiveScene);
export const useIsStreaming = () => useObsStore(computeIsStreaming);
