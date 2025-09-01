// src/store/connectionsStore.ts
import { create } from 'zustand';
import { default as OBSWebSocket } from 'obs-websocket-js';

// Global instance of the OBS WebSocket client
const obs = new OBSWebSocket();

// Your existing state and functions
interface ConnectionState {
  isConnected: boolean;
  connectionError: string | null;
  isLoading: boolean;
  connectToObs: (url: string, password?: string) => void;
  disconnectFromObs: () => void;
}

const useConnectionsStore = create<ConnectionState>((set, get) => ({
  isConnected: false,
  connectionError: null,
  isLoading: false,

  connectToObs: async (url, password) => {
    set({ isLoading: true, connectionError: null });

    try {
      // Connect to the OBS WebSocket server
      const { obsWebSocketVersion, obsStudioVersion } = await obs.connect(url, password);
      console.log(`Connected to OBS Studio ${obsStudioVersion} (using OBS WebSocket ${obsWebSocketVersion})`);

      set({ 
        isConnected: true, 
        isLoading: false, 
        connectionError: null 
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
      await obs.disconnect();
      set({ 
        isConnected: false, 
        connectionError: null,
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to disconnect from OBS:', error);
      set({ 
        connectionError: 'Failed to disconnect.',
        isLoading: false
      });
    }
  }
}));

// Add event listeners to handle disconnections
obs.on('ConnectionClosed', () => {
    console.log('OBS WebSocket connection closed.');
    useConnectionsStore.setState({ isConnected: false, connectionError: 'Connection closed.', isLoading: false });
});

export default useConnectionsStore;
