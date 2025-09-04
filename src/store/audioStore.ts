import { create } from 'zustand';
import { GoogleGenAI, LiveMusicGenerationConfig, LiveMusicSession } from '@google/genai';
import { logger } from '../utils/logger';
import { MusicGenerationConfig } from '../types/audio';
import { Buffer } from 'buffer';
import { pcm16ToWavUrl } from '@/lib/pcmToWavUrl';

export interface AudioState {
  musicSession: LiveMusicSession | null;
  isMusicPlaying: boolean;
  currentMusicPrompt: string;
  musicGenerationConfig: LiveMusicGenerationConfig | null;
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
    updateMusicGeneration: (config: Partial<LiveMusicGenerationConfig>) => Promise<void>;
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
  musicGenerationConfig: null,
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
        const context = new window.AudioContext({ sampleRate: 44100 });
        const mediaStreamDest = context.createMediaStreamDestination();
        set({ audioContext: context, mediaStreamDest });
      }
    },
    startMusicGeneration: async (prompt, config) => {
      const { actions, musicSession } = get();
      if (musicSession) {
        actions.stopMusic();
      }

      actions.initializeAudioContext();
      const ai = new GoogleGenAI({ apiKey: config.geminiApiKey, apiVersion: 'v1alpha' });

      const session: LiveMusicSession = await ai.live.music.connect({
        model: 'models/lyria-realtime-exp',
        callbacks: {
          onmessage: (message) => {
            if (message.serverContent?.audioChunks) {
              for (const chunk of message.serverContent.audioChunks) {
                if (chunk.data) {
                  const audioBuffer = Buffer.from(chunk.data, 'base64');
                  actions.addAudioChunk(audioBuffer);
                }
              }
            }
          },
          onerror: (error) => logger.error('Music session error:', error),
          onclose: () => logger.info('Lyria RealTime stream closed.'),
        },
      });

      await session.setWeightedPrompts({
        weightedPrompts: [{ text: prompt, weight: 1.0 }],
      });

      const liveConfig: LiveMusicGenerationConfig = {
        bpm: config.bpm,
        temperature: config.temperature,
        density: config.density,
        brightness: config.brightness,
        guidance: config.guidance,
        scale: config.scale as any,
        muteBass: config.muteBass,
        muteDrums: config.muteDrums,
        onlyBassAndDrums: config.onlyBassAndDrums,
        musicGenerationMode: config.musicGenerationMode as any,
      };

      await session.setMusicGenerationConfig({
        musicGenerationConfig: liveConfig,
      });

      await session.play();

      set({
        musicSession: session,
        musicGenerationConfig: liveConfig,
        isMusicPlaying: true,
        currentMusicPrompt: prompt,
        isPlayerVisible: true,
        activeAudioSource: { type: 'music', prompt },
      });
    },
    updateMusicGeneration: async (config) => {
      const { musicSession, musicGenerationConfig } = get();
      if (!musicSession) return;

      const newConfig = { ...musicGenerationConfig, ...config };

      await musicSession.setMusicGenerationConfig({
        musicGenerationConfig: newConfig as LiveMusicGenerationConfig,
      });

      set({ musicGenerationConfig: newConfig as LiveMusicGenerationConfig });

      if (config.bpm || config.scale) {
        await musicSession.resetContext();
      }
    },
    addAudioChunk: (pcm) => {
      const { audioContext } = get();
      if (!audioContext) return;

      const wavUrl = pcm16ToWavUrl(pcm, 44100, 2);
      const audio = new Audio(wavUrl);
      audio.play();
    },
    playFromQueue: () => {
      // This is now handled by addAudioChunk directly
    },
    pauseMusic: () => {
      get().musicSession?.pause();
      set({ isMusicPlaying: false });
    },
    resumeMusic: () => {
      get().musicSession?.play();
      set({ isMusicPlaying: true });
    },
    stopMusic: () => {
      get().musicSession?.stop();
      set({
        musicSession: null,
        isMusicPlaying: false,
        isPlayerVisible: false,
        activeAudioSource: null,
        musicGenerationConfig: null,
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
