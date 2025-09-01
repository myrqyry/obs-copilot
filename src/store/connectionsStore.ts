// src/store/connectionsStore.ts
import { create } from 'zustand';
import { OBSScene, OBSSource, ObsClientImpl } from '@/types'; // Import ObsClientImpl

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

// Your existing state and functions
interface ConnectionState {
  isConnected: boolean;
  connectionError: string | null;
  isLoading: boolean;
  obsServiceInstance: ObsClientImpl | null; // Use ObsClientImpl type
  scenes: OBSScene[];
  currentProgramScene: string | null;
  sources: OBSSource[];
  streamStatus: OBSResponseTypes['GetStreamStatus'] | null;
  recordStatus: OBSResponseTypes['GetRecordStatus'] | null;
  videoSettings: OBSResponseTypes['GetVideoSettings'] | null;
  connectToObs: (url: string, password?: string) => void;
  disconnectFromObs: () => void;
  setScenes: (scenes: OBSScene[]) => void;
  setCurrentProgramScene: (sceneName: string | null) => void;
  setSources: (sources: OBSSource[]) => void;
  setStreamStatus: (status: OBSResponseTypes['GetStreamStatus'] | null) => void;
  setRecordStatus: (status: OBSResponseTypes['GetRecordStatus'] | null) => void;
  setVideoSettings: (settings: OBSResponseTypes['GetVideoSettings'] | null) => void;
}

const useConnectionsStore = create<ConnectionState>((set) => {
  let obs: any | null = null; // Use 'any' for the obs instance

  return {
    isConnected: false,
    connectionError: null,
    isLoading: false,
    obsServiceInstance: null,
    scenes: [],
    currentProgramScene: null,
    sources: [],
    streamStatus: null,
    recordStatus: null,
    videoSettings: null,

    connectToObs: async (url, password) => {
      set({ isLoading: true, connectionError: null });

      try {
        // Dynamically import OBSWebSocket and instantiate it here
        const OBSWebSocketModule = await import('obs-websocket-js');
        obs = new (OBSWebSocketModule.default as any)(); // Cast to any to bypass constructable type error

        // Add event listener for connection closure
        obs.on('ConnectionClosed', () => {
          console.log('OBS WebSocket connection closed.');
          set({ isConnected: false, connectionError: 'Connection closed.', isLoading: false, obsServiceInstance: null });
        });

        // Connect to the OBS WebSocket server
        const { obsWebSocketVersion, obsStudioVersion } = await (obs as any).connect(url, password); // Cast to any
        console.log(`Connected to OBS Studio ${obsStudioVersion} (using OBS WebSocket ${obsWebSocketVersion})`);

        // Fetch initial OBS data
        const { scenes } = await (obs as any).call('GetSceneList');
        const { currentProgramSceneName } = await (obs as any).call('GetCurrentProgramScene');
        const { sceneItems } = await (obs as any).call('GetSceneItemList', { sceneName: currentProgramSceneName });
        const streamStatus = await (obs as any).call('GetStreamStatus');
        const recordStatus = await (obs as any).call('GetRecordStatus');
        const videoSettings = await (obs as any).call('GetVideoSettings');

        set({ 
          isConnected: true, 
          isLoading: false, 
          connectionError: null,
          obsServiceInstance: obs,
          scenes: scenes.map((s: any) => ({ sceneName: s.sceneName, sceneIndex: s.sceneIndex })),
          currentProgramScene: currentProgramSceneName,
          sources: sceneItems.map((item: any) => ({
            sourceName: item.sourceName,
            typeName: item.inputKind,
            sceneItemId: item.sceneItemId,
            sceneItemEnabled: item.sceneItemEnabled,
          })),
          streamStatus: streamStatus,
          recordStatus: recordStatus,
          videoSettings: videoSettings,
        });
        
      } catch (error) {
        console.error('Failed to connect to OBS:', error);
        set({ 
          isConnected: false, 
          isLoading: false, 
          connectionError: 'Failed to connect. Please check the URL and password.' 
        });
      }
    },

    disconnectFromObs: async () => {
      try {
        if (obs) {
          await (obs as any).disconnect();
        }
        set({ 
          isConnected: false, 
          connectionError: null,
          isLoading: false,
          obsServiceInstance: null
        });
      } catch (error) {
        console.error('Failed to disconnect from OBS:', error);
        set({ 
          connectionError: 'Failed to disconnect.',
          isLoading: false
        });
      }
    },
    setScenes: (scenes) => set({ scenes }),
    setCurrentProgramScene: (sceneName) => set({ currentProgramScene: sceneName }),
    setSources: (sources) => set({ sources }),
    setStreamStatus: (status) => set({ streamStatus: status }),
    setRecordStatus: (status) => set({ recordStatus: status }),
    setVideoSettings: (settings) => set({ videoSettings: settings }),
  };
});

export default useConnectionsStore;
