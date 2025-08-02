import { create } from 'zustand';
import { logger } from '../utils/logger';
import { MusicSession, MusicGenerationConfig } from '../types/audio';

export interface AudioState {
  musicSession: MusicSession | null;
  isMusicPlaying: boolean;
  currentMusicPrompt: string;
  audioContext: AudioContext | null;
  audioQueue: AudioBuffer[];
  isQueuePlaying: boolean;
  mediaStreamDest: MediaStreamAudioDestinationNode | null;
  audioDevices: MediaDeviceInfo[];
  selectedAudioOutputId: string;
  audioPermissionGranted: boolean;
  isPlayerVisible: boolean;
  activeAudioSource: { type: 'tts' | 'music'; prompt?: string; url?: string } | null;
  actions: {
    setMusicPrompt: (prompt: string) => void;
    setActiveAudioSource: (
      source: { type: 'tts' | 'music'; prompt?: string; url?: string } | null,
    ) => void;
    initializeAudioContext: () => void;
    startMusicGeneration: (prompt: string, config: MusicGenerationConfig) => Promise<void>;
    addAudioChunk: (pcm: ArrayBuffer) => void;
    playFromQueue: () => void;
    pauseMusic: () => void;
    resumeMusic: () => void;
    stopMusic: () => void;
    loadAudioDevices: () => Promise<void>;
    setAudioOutputDevice: (deviceId: string) => void;
  };
}

export const useAudioStore = create<AudioState>((set, get) => ({
  musicSession: null,
  isMusicPlaying: false,
  currentMusicPrompt: '',
  audioContext: null,
  audioQueue: [],
  isQueuePlaying: false,
  mediaStreamDest: null,
  audioDevices: [],
  selectedAudioOutputId: 'default',
  audioPermissionGranted: false,
  isPlayerVisible: false,
  activeAudioSource: null,
  actions: {
    setMusicPrompt: (prompt) => set({ currentMusicPrompt: prompt }),
    setActiveAudioSource: (source) => set({ activeAudioSource: source }),
    initializeAudioContext: () => {
      if (!get().audioContext) {
        const context = new window.AudioContext({ sampleRate: 48000 });
        set({ audioContext: context });
      }
    },
    startMusicGeneration: async (prompt, config) => {
      // This is a placeholder. The full implementation would require the Gemini API client
      // and would be more complex.
      logger.info('Starting music generation with prompt:', prompt, config);
      get().actions.initializeAudioContext();
      set({
        isMusicPlaying: true,
        currentMusicPrompt: prompt,
        isPlayerVisible: true,
        activeAudioSource: { type: 'music', prompt },
      });
    },
    addAudioChunk: (pcm) => {
      // Placeholder
      logger.info('Adding audio chunk:', pcm);
    },
    playFromQueue: () => {
      // Placeholder
      logger.info('Playing from queue');
    },
    pauseMusic: () => {
      const { audioContext } = get();
      if (audioContext && audioContext.state === 'running') {
        audioContext.suspend();
      }
    },
    resumeMusic: () => {
      const { audioContext } = get();
      if (audioContext && audioContext.state !== 'running') {
        audioContext.resume();
      }
    },
    stopMusic: () => {
      set({
        audioQueue: [],
        isQueuePlaying: false,
        isMusicPlaying: false,
        audioContext: null,
        musicSession: null,
        isPlayerVisible: false,
        activeAudioSource: null,
      });
    },
    loadAudioDevices: async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        set({ audioPermissionGranted: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioOutputs = devices.filter((device) => device.kind === 'audiooutput');
        set({ audioDevices: audioOutputs });
      } catch (err) {
        set({ audioPermissionGranted: false });
      }
    },
    setAudioOutputDevice: (deviceId) => {
      set({ selectedAudioOutputId: deviceId });
    },
  },
}));
