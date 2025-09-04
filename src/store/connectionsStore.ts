// src/store/connectionsStore.ts
import { create } from 'zustand';
import OBSWebSocket from 'obs-websocket-js';
import type { OBSScene, OBSSource } from '@/types';
import { StreamerBotService } from '@/services/streamerBotService';

// Define a minimal OBSResponseTypes interface locally to unblock compilation
interface OBSResponseTypes {
  GetStreamStatus: {
    outputActive: boolean;
    outputReconnecting: boolean;
    outputTimecode: string;
    outputBytes: number;
    outputSkippedFrames: number;
    outputTotalFrames: number;
    renderMissedFrames: number;
    renderTotalFrames: number;
    webSocketServerClients: number;
    outputDuration: number;
    outputCongestion: number;
  };
  GetRecordStatus: {
    outputActive: boolean;
    outputPaused: boolean;
    outputTimecode: string;
    outputBytes: number;
    outputDuration: number;
  };
  GetVideoSettings: {
    fpsNumerator: number;
    fpsDenominator: number;
    baseWidth: number;
    baseHeight: number;
    outputWidth: number;
    outputHeight: number;
  };
}

export interface ConnectionState {
  obs: any | null;
  isConnected: boolean;
  connectionError: string | null;
  isLoading: boolean;
  scenes: OBSScene[];
  currentProgramScene: string | null;
  sources: OBSSource[];
  streamStatus: OBSResponseTypes['GetStreamStatus'] | null;
  recordStatus: OBSResponseTypes['GetRecordStatus'] | null;
  videoSettings: OBSResponseTypes['GetVideoSettings'] | null;
  streamerBotServiceInstance: StreamerBotService | null;
  connectToObs: (url: string, password?: string) => Promise<void>;
  disconnectFromObs: () => Promise<void>;
  setScenes: (scenes: OBSScene[]) => void;
  setCurrentProgramScene: (sceneName: string | null) => void;
  setSources: (sources: OBSSource[]) => void;
  setStreamStatus: (status: OBSResponseTypes['GetStreamStatus'] | null) => void;
  setRecordStatus: (status: OBSResponseTypes['GetRecordStatus'] | null) => void;
  setVideoSettings: (settings: OBSResponseTypes['GetVideoSettings'] | null) => void;
}

const useConnectionsStore = create<ConnectionState>((set, get) => ({
  obs: null,
  isConnected: false,
  connectionError: null,
  isLoading: false,
  scenes: [],
  currentProgramScene: null,
  sources: [],
  streamStatus: null,
  recordStatus: null,
  videoSettings: null,
  streamerBotServiceInstance: null,

  connectToObs: async (url, password) => {
    if (get().obs) {
      await get().disconnectFromObs();
    }

    set({ isLoading: true, connectionError: null });
    const obs = new OBSWebSocket();

    obs.on('ConnectionClosed', () => {
      console.log('OBS WebSocket connection closed.');
      set({ isConnected: false, connectionError: 'Connection closed.', isLoading: false, obs: null });
    });

    try {
      // Validate URL format
      if (!url || !url.startsWith('ws://') && !url.startsWith('wss://')) {
        throw new Error('Invalid WebSocket URL format. Must start with ws:// or wss://');
      }

      const { obsWebSocketVersion, obsStudioVersion } = await obs.connect(url, password);
      console.log(`Connected to OBS Studio ${obsStudioVersion} (using OBS WebSocket ${obsWebSocketVersion})`);

      const { scenes } = await obs.call('GetSceneList');
      const { currentProgramSceneName } = await obs.call('GetCurrentProgramScene');
      const { sceneItems } = await obs.call('GetSceneItemList', { sceneName: currentProgramSceneName });
      const streamStatus = await obs.call('GetStreamStatus');
      const recordStatus = await obs.call('GetRecordStatus');
      const videoSettings = await obs.call('GetVideoSettings');

      set({
        isConnected: true,
        isLoading: false,
        connectionError: null,
        obs: obs,
        scenes: scenes.map((s: any) => ({ sceneName: s.sceneName, sceneIndex: s.sceneIndex })),
        currentProgramScene: currentProgramSceneName,
        sources: sceneItems.map((item: any) => ({
          sourceName: item.sourceName,
          typeName: item.inputKind,
          sceneItemId: item.sceneItemId,
          sceneItemEnabled: item.sceneItemEnabled,
        })),
        streamStatus,
        recordStatus,
        videoSettings,
      });
    } catch (error: any) {
      console.error('Failed to connect to OBS:', error);
      const errorMessage = error?.message || 'Failed to connect. Please check the URL and password.';
      set({
        isConnected: false,
        isLoading: false,
        connectionError: errorMessage,
        obs: null,
      });
    }
  },

  disconnectFromObs: async () => {
    const obs = get().obs;
    if (obs) {
      try {
        await obs.disconnect();
      } catch (error) {
        console.error('Failed to disconnect from OBS:', error);
      } finally {
        set({
          isConnected: false,
          connectionError: null,
          isLoading: false,
          obs: null,
        });
      }
    }
  },

  setScenes: (scenes) => set({ scenes }),
  setCurrentProgramScene: (sceneName) => set({ currentProgramScene: sceneName }),
  setSources: (sources) => set({ sources }),
  setStreamStatus: (status) => set({ streamStatus: status }),
  setRecordStatus: (status) => set({ recordStatus: status }),
  setVideoSettings: (settings) => set({ videoSettings: settings }),
}));

export default useConnectionsStore;
