// src/store/connectionsStore.ts
import { create } from 'zustand';
import OBSWebSocket from 'obs-websocket-js';
import { OBSScene, OBSSource } from '@/types'; // Import ObsClientImpl removed

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

// Create a global instance of the OBS WebSocket client
const obs = new (OBSWebSocket as any)();

// Your existing state and functions
interface ConnectionState {
  obs: any; // 👈 Add this line to make the OBS instance part of the state
  isConnected: boolean;
  connectionError: string | null;
  isLoading: boolean;
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
  return {
    obs: obs, // 👈 Initialize the OBS instance in the store
    isConnected: false,
    connectionError: null,
    isLoading: false,
    scenes: [],
    currentProgramScene: null,
    sources: [],
    streamStatus: null,
    recordStatus: null,
    videoSettings: null,

    connectToObs: async (url, password) => {
      set({ isLoading: true, connectionError: null });

      try {
        // Connect to the OBS WebSocket server
        const { obsWebSocketVersion, obsStudioVersion } = await obs.connect(url, password);
        console.log(`Connected to OBS Studio ${obsStudioVersion} (using OBS WebSocket ${obsWebSocketVersion})`);

        // Fetch initial OBS data
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
          obs: obs, // Set the obs instance in the store
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
          await obs.disconnect();
        }
        set({ 
          isConnected: false, 
          connectionError: null,
          isLoading: false,
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

// Add event listeners to handle disconnections
obs.on('ConnectionClosed', () => {
    console.log('OBS WebSocket connection closed.');
    useConnectionsStore.setState({ isConnected: false, connectionError: 'Connection closed.', isLoading: false });
});

export default useConnectionsStore;
