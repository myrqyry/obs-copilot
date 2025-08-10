import { create } from 'zustand';

interface ConnectionState {
  isConnected: boolean;
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
  streamerBotServiceInstance: any;
}

interface ConnectionsActions {
  setConnected: (isConnected: boolean) => void;
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
}

const useConnectionsStore = create<ConnectionState & ConnectionsActions>((set, get) => ({
  isConnected: false,
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

  // Add other actions here
}));

export default useConnectionsStore;
