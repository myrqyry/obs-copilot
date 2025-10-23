import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import useUiStore from './uiStore';

export interface GenerationResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface GenerationHistoryItem {
  id: string;
  type: 'image' | 'speech' | 'music' | 'video';
  prompt: string;
  model: string;
  result: any;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface GenerateState {
  // Current generation state
  isGenerating: boolean;
  progress: number;
  currentModel: string | null;
  lastGeneration: GenerationHistoryItem | null;

  // Generation history
  generationHistory: GenerationHistoryItem[];

  // Actions
  setGenerating: (generating: boolean) => void;
  setProgress: (progress: number) => void;
  setCurrentModel: (model: string | null) => void;

  // Generation methods
  generateImage: (params: any) => Promise<GenerationResult>;
  generateSpeech: (params: any) => Promise<GenerationResult>;
  generateMusic: (params: any) => Promise<GenerationResult>;
  generateVideo: (params: any) => Promise<GenerationResult>;

  // History management
  addToHistory: (item: Omit<GenerationHistoryItem, 'id'>) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
  exportHistory: () => void;
}

export const useGenerateStore = create<GenerateState>()(
  persist(
    (set, get) => ({
      // Initial state
      isGenerating: false,
      progress: 0,
      currentModel: null,
      lastGeneration: null,
      generationHistory: [],

      // Basic setters
      setGenerating: (generating) => set({ isGenerating: generating }),
      setProgress: (progress) => set({ progress }),
      setCurrentModel: (model) => set({ currentModel: model }),

      // Image generation
      generateImage: async (params) => {
        set({ isGenerating: true, progress: 0, currentModel: params.model });

        try {
          // Simulate progress updates
          const progressInterval = setInterval(() => {
            set((state) => ({
              progress: Math.min(state.progress + Math.random() * 20, 90)
            }));
          }, 500);

          const response = await fetch('/api/gemini/generate-image-enhanced', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
          });

          clearInterval(progressInterval);

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          set({ progress: 100 });

          // Create history item
          const historyItem: GenerationHistoryItem = {
            id: Date.now().toString(),
            type: 'image',
            prompt: params.prompt,
            model: params.model,
            result: data,
            timestamp: Date.now(),
            metadata: {
              aspectRatio: params.aspectRatio,
              imageFormat: params.imageFormat,
              isEditing: !!params.imageInput
            }
          };

          set({ lastGeneration: historyItem });

          return { success: true, data };
        } catch (error: any) {
          console.error('Image generation failed:', error);
          return { success: false, error: error.message };
        } finally {
          set({ isGenerating: false, progress: 0 });
        }
      },

      // Speech generation
      generateSpeech: async (params) => {
        set({ isGenerating: true, progress: 0, currentModel: 'gemini-2.5-flash-preview-tts' });

        try {
          // Simulate progress
          const progressInterval = setInterval(() => {
            set((state) => ({
              progress: Math.min(state.progress + Math.random() * 25, 90)
            }));
          }, 300);

          const response = await fetch('/api/gemini/generate-speech', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
          });

          clearInterval(progressInterval);

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          set({ progress: 100 });

          const historyItem: GenerationHistoryItem = {
            id: Date.now().toString(),
            type: 'speech',
            prompt: params.text,
            model: 'gemini-2.5-flash-preview-tts',
            result: data,
            timestamp: Date.now(),
            metadata: {
              isMultiSpeaker: params.isMultiSpeaker,
              voice: params.isMultiSpeaker ? `${params.speaker1Voice}, ${params.speaker2Voice}` : params.voice
            }
          };

          set({ lastGeneration: historyItem });

          return { success: true, data };
        } catch (error: any) {
          console.error('Speech generation failed:', error);
          return { success: false, error: error.message };
        } finally {
          set({ isGenerating: false, progress: 0 });
        }
      },

      // Music generation (placeholder)
      generateMusic: async (params) => {
        set({ isGenerating: true, progress: 0, currentModel: 'gemini-music-preview' });

        try {
          // Simulate generation - replace with actual API call when available
          await new Promise(resolve => setTimeout(resolve, 3000));
          set({ progress: 100 });

          const mockData = {
            audioData: 'mock-base64-audio-data',
            duration: 30,
            format: 'mp3'
          };

          const historyItem: GenerationHistoryItem = {
            id: Date.now().toString(),
            type: 'music',
            prompt: params.description,
            model: 'gemini-music-preview',
            result: mockData,
            timestamp: Date.now(),
            metadata: {
              duration: params.duration,
              style: params.style
            }
          };

          set({ lastGeneration: historyItem });

          return { success: true, data: mockData };
        } catch (error: any) {
          return { success: false, error: error.message };
        } finally {
          set({ isGenerating: false, progress: 0 });
        }
      },

      // Video generation (placeholder)
      generateVideo: async (params) => {
        set({ isGenerating: true, progress: 0, currentModel: 'gemini-video-preview' });

        try {
          // Placeholder - video generation not yet available
          throw new Error('Video generation coming soon');
        } catch (error: any) {
          return { success: false, error: error.message };
        } finally {
          set({ isGenerating: false, progress: 0 });
        }
      },

      // History management
      addToHistory: (item) => {
        const historyItem: GenerationHistoryItem = {
          ...item,
          id: Date.now().toString()
        };

        set((state) => ({
          generationHistory: [historyItem, ...state.generationHistory].slice(0, 100), // Keep last 100
          lastGeneration: historyItem
        }));
      },

      removeFromHistory: (id) => {
        set((state) => ({
          generationHistory: state.generationHistory.filter(item => item.id !== id)
        }));
      },

      clearHistory: () => {
        set({ generationHistory: [], lastGeneration: null });
      },

      exportHistory: () => {
        const { generationHistory } = get();
        const dataStr = JSON.stringify(generationHistory, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `generation-history-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        useUiStore.getState().addToast({
          title: 'History Exported',
          message: 'Your generation history has been saved to a JSON file.',
        });
      }
    }),
    {
      name: 'generate-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        generationHistory: state.generationHistory,
        lastGeneration: state.lastGeneration
      })
    }
  )
);