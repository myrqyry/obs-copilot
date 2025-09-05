// src/store/connectionsStore.ts
import { create } from 'zustand';
import { ObsClientImpl, ConnectionStatus } from '@/services/obsClient';
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
  obs: ObsClientImpl | null;
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

const useConnectionsStore = create<ConnectionState>((set, get) => {
    const obsClient = ObsClientImpl.getInstance();

    obsClient.addStatusListener((status: ConnectionStatus) => {
        set({
            isConnected: status === 'connected',
            isLoading: status === 'connecting' || status === 'reconnecting',
            connectionError: status === 'error' ? 'Connection failed' : null,
        });

        if (status === 'connected') {
            // When connected, fetch initial data
            obsClient.getSceneList().then(({ scenes }: any) => set({ scenes: scenes.map((s: any) => ({ sceneName: s.sceneName, sceneIndex: s.sceneIndex })) }));
            obsClient.getCurrentProgramScene().then(({ currentProgramSceneName }: any) => set({ currentProgramScene: currentProgramSceneName }));
            // You might want to fetch sources for the current scene here as well
            obsClient.getStreamStatus().then((status: any) => set({ streamStatus: status }));
            obsClient.getRecordStatus().then((status: any) => set({ recordStatus: status }));
            obsClient.getVideoSettings().then((settings: any) => set({ videoSettings: settings }));
        }
    });

    // Event listeners for OBS updates
    obsClient.on('SceneListChanged', ({ scenes }: any) => {
        set({ scenes: scenes.map((s: any) => ({ sceneName: s.sceneName, sceneIndex: s.sceneIndex })) });
    });
    obsClient.on('CurrentProgramSceneChanged', ({ sceneName }: any) => {
        set({ currentProgramScene: sceneName });
        // Fetch new sources for the new scene
        obsClient.getSceneItemList(sceneName).then(({ sceneItems }: any) => {
            set({
                sources: sceneItems.map((item: any) => ({
                    sourceName: item.sourceName,
                    typeName: item.inputKind,
                    sceneItemId: item.sceneItemId,
                    sceneItemEnabled: item.sceneItemEnabled,
                })),
            });
        });
    });
    obsClient.on('StreamStateChanged', (data: any) => {
        // This event provides more detailed status updates
        const { outputActive, outputReconnecting } = data;
        const currentStatus = get().streamStatus;
        set({ streamStatus: { ...currentStatus, outputActive, outputReconnecting } as any });
    });
     obsClient.on('RecordStateChanged', (data: any) => {
        const { outputActive, outputPaused } = data;
        const currentStatus = get().recordStatus;
        set({ recordStatus: { ...currentStatus, outputActive, outputPaused } as any });
    });


  return {
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
  streamerBotServiceInstance: null,

  connectToObs: async (url, password) => {
    try {
        await obsClient.connect(url, password);
    } catch (error: any) {
        set({ connectionError: error.message });
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
    });
  },

  setScenes: (scenes) => set({ scenes }),
  setCurrentProgramScene: (sceneName) => set({ currentProgramScene: sceneName }),
  setSources: (sources) => set({ sources }),
  setStreamStatus: (status) => set({ streamStatus: status }),
  setRecordStatus: (status) => set({ recordStatus: status }),
  setVideoSettings: (settings) => set({ videoSettings: settings }),
}});

export default useConnectionsStore;