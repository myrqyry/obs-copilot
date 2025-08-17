import { create } from 'zustand';
import { StreamerBotService } from '../services/streamerBotService';

export interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  apiKey: string | null;
  otherRelevantState: string;
  obsServiceInstance: any;
  onRefreshData: () => void;
  scenes: any[];
  currentProgramScene: string;
  sources: any[];
  streamStatus: any;
  recordStatus: any;
  videoSettings: any;
  obsStats: any;
  streamerBotServiceInstance: StreamerBotService | null;
}

export interface ConnectionsActions {
  setConnected: (isConnected: boolean) => void;
  setConnecting: (isConnecting: boolean) => void;
  setError: (error: string | null) => void;
  setApiKey: (apiKey: string | null) => void;
  otherAction: () => void;
  setObsServiceInstance: (obsServiceInstance: any) => void;
  setOnRefreshData: (onRefreshData: () => void) => void;
  setScenes: (scenes: any[]) => void;
  setCurrentProgramScene: (currentProgramScene: string) => void;
  setSources: (sources: any[]) => void;
  setStreamStatus: (streamStatus: any) => void;
  setRecordStatus: (recordStatus: any) => void;
  setVideoSettings: (videoSettings: any) => void;
  setObsStats: (obsStats: any) => void;
  connect: (url: string, password?: string) => Promise<void>;
  disconnect: () => void;
}

const useConnectionsStore = create<ConnectionState & ConnectionsActions>((set, get) => ({
  isConnected: false,
  isConnecting: false,
  error: null,
  apiKey: null,
  otherRelevantState: '',
  obsServiceInstance: null,
  streamerBotServiceInstance: null,
  onRefreshData: () => {},
  scenes: [],
  currentProgramScene: '',
  sources: [],
  streamStatus: null,
  recordStatus: null,
  videoSettings: null,
  obsStats: null,

  setConnected: (isConnected) => set({ isConnected }),
  setConnecting: (isConnecting) => set({ isConnecting }),
  setError: (error) => set({ error }),
  setApiKey: (apiKey) => set({ apiKey }),
  otherAction: () => set({ otherRelevantState: 'new value' }),
  setObsServiceInstance: (obsServiceInstance) => set({ obsServiceInstance }),
  setOnRefreshData: (onRefreshData) => set({ onRefreshData }),
  setScenes: (scenes) => set({ scenes }),
  setCurrentProgramScene: (currentProgramScene) => set({ currentProgramScene }),
  setSources: (sources) => set({ sources }),
  setStreamStatus: (streamStatus) => set({ streamStatus }),
  setRecordStatus: (recordStatus) => set({ recordStatus }),
  setVideoSettings: (videoSettings) => set({ videoSettings }),
  setObsStats: (obsStats) => set({ obsStats }),

  connect: async (url, password) => {
    const { obsServiceInstance, setConnecting, setConnected, setError } = get();
    if (!obsServiceInstance) {
      setError('OBS service instance not available.');
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      await obsServiceInstance.connect(url, password);
      setConnected(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      setConnected(false);
    } finally {
      setConnecting(false);
    }
  },
  disconnect: () => {
    const { obsServiceInstance, setConnected } = get();
    if (obsServiceInstance) {
      obsServiceInstance.disconnect();
    }
    setConnected(false);
  },
}));

export default useConnectionsStore;
