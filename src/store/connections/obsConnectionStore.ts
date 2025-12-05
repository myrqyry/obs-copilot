// src/store/connections/obsConnectionStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface Scene {
  name: string;
  id: string;
  index: number;
}

interface Source {
  name: string;
  id: string;
  type: string;
  sceneId: string;
}

interface OBSConnectionState {
  // Connection State
  connected: boolean;
  connecting: boolean;
  error: string | null;

  // OBS Data
  scenes: Scene[];
  currentScene: string | null;
  sources: Source[];
  streaming: boolean;
  recording: boolean;

  // Actions
  setConnected: (connected: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  setError: (error: string | null) => void;
  setScenes: (scenes: Scene[]) => void;
  setCurrentScene: (sceneName: string) => void;
  setSources: (sources: Source[]) => void;
  addSource: (source: Source) => void;
  removeSource: (sourceId: string) => void;
  updateSource: (sourceId: string, updates: Partial<Source>) => void;
  setStreaming: (streaming: boolean) => void;
  setRecording: (recording: boolean) => void;
  reset: () => void;
}

const initialState = {
  connected: false,
  connecting: false,
  error: null,
  scenes: [],
  currentScene: null,
  sources: [],
  streaming: false,
  recording: false,
};

// Computed selectors
const selectActiveScene = (state: OBSConnectionState) =>
  state.scenes.find((s) => s.name === state.currentScene);

const selectActiveSources = (state: OBSConnectionState) =>
  state.sources.filter((s) => s.sceneId === state.currentScene);

const selectSourcesByScene = (state: OBSConnectionState, sceneId: string) =>
  state.sources.filter((s) => s.sceneId === sceneId);

export const useOBSConnectionStore = create<OBSConnectionState>()(
  devtools(
    persist(
      immer((set) => ({
        ...initialState,

        setConnected: (connected) =>
          set((state) => {
            state.connected = connected;
            if (!connected) {
              state.currentScene = null;
              state.streaming = false;
              state.recording = false;
            }
          }),

        setConnecting: (connecting) =>
          set((state) => {
            state.connecting = connecting;
          }),

        setError: (error) =>
          set((state) => {
            state.error = error;
          }),

        setScenes: (scenes) =>
          set((state) => {
            state.scenes = scenes;
          }),

        setCurrentScene: (sceneName) =>
          set((state) => {
            state.currentScene = sceneName;
          }),

        setSources: (sources) =>
          set((state) => {
            state.sources = sources;
          }),

        addSource: (source) =>
          set((state) => {
            state.sources.push(source);
          }),

        removeSource: (sourceId) =>
          set((state) => {
            state.sources = state.sources.filter((s) => s.id !== sourceId);
          }),

        updateSource: (sourceId, updates) =>
          set((state) => {
            const index = state.sources.findIndex((s) => s.id === sourceId);
            if (index !== -1) {
              state.sources[index] = { ...state.sources[index], ...updates };
            }
          }),

        setStreaming: (streaming) =>
          set((state) => {
            state.streaming = streaming;
          }),

        setRecording: (recording) =>
          set((state) => {
            state.recording = recording;
          }),

        reset: () => set(initialState),
      })),
      {
        name: 'obs-connection-store',
        partialize: (state) => ({
          scenes: state.scenes,
          currentScene: state.currentScene,
          sources: state.sources,
        }),
      }
    ),
    { name: 'OBS Connection Store' }
  )
);

// Export computed selectors as hooks
export const useActiveScene = () => useOBSConnectionStore(selectActiveScene);
export const useActiveSources = () => useOBSConnectionStore(selectActiveSources);
export const useSourcesByScene = (sceneId: string) =>
  useOBSConnectionStore((state) => selectSourcesByScene(state, sceneId));
