
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';

export interface ImageUploadResult {
  id: string;
  url: string;
  file: File;
  name: string;
  size: number;
}

export interface ImageEditorState {
  // File management
  inputUrl: string | null;
  outputUrl: string | null;
  inputBlob: Blob | null;
  currentImage: string | null;
  
  // Basic manipulation
  crop: { x: number; y: number };
  zoom: number;
  rotation: number;
  aspect: number | undefined;
  croppedAreaPixels: any;
  isCropping: boolean;
  
  // Dimensions
  width: number | string;
  height: number | string;
  
  // Transformations
  flipH: boolean;
  flipV: boolean;
  filter: string;
  
  // Text overlay
  textOverlay: string;
  textColor: string;
  textSize: number;
  textX: number;
  textY: number;
  
  // AI features
  aiPrompt: string;
  aiLoading: boolean;
  aiError: string | null;
  generatedImages: string[];
  showAiPanel: boolean;
  aiModel: string;
  aspectRatio: string;
  numberOfImages: number;
  characterConsistency: boolean;
  multiImageFusion: boolean;
  worldKnowledge: boolean;
  uploadedImages: ImageUploadResult[];
  showGeneratedImages: boolean;
  
  // UI states
  inputModalOpen: boolean;
  loading: boolean;
  
  // History for undo/redo
  history: Partial<ImageEditorState>[];
  historyIndex: number;
}

const initialState: ImageEditorState = {
  inputUrl: null,
  outputUrl: null,
  inputBlob: null,
  currentImage: null,
  crop: { x: 0, y: 0 },
  zoom: 1,
  rotation: 0,
  aspect: undefined,
  croppedAreaPixels: null,
  isCropping: false,
  width: 'auto',
  height: 'auto',
  flipH: false,
  flipV: false,
  filter: 'none',
  textOverlay: '',
  textColor: '#ffffff',
  textSize: 24,
  textX: 50,
  textY: 50,
  aiPrompt: '',
  aiLoading: false,
  aiError: null,
  generatedImages: [],
  showAiPanel: false,
  aiModel: 'gemini-2.5-flash-image-preview',
  aspectRatio: '1:1',
  numberOfImages: 1,
  characterConsistency: false,
  multiImageFusion: false,
  worldKnowledge: false,
  uploadedImages: [],
  showGeneratedImages: false,
  inputModalOpen: false,
  loading: false,
  history: [],
  historyIndex: -1,
};

export const useImageEditorStore = create<ImageEditorState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        setInputImage: (url: string, blob: Blob) => {
          set((state) => {
            // Clean up previous URLs
            if (state.inputUrl) URL.revokeObjectURL(state.inputUrl);
            if (state.outputUrl) URL.revokeObjectURL(state.outputUrl);
            if (state.currentImage) URL.revokeObjectURL(state.currentImage);
            
            return {
              inputUrl: url,
              inputBlob: blob,
              currentImage: url,
              outputUrl: null,
            };
          });
        },
        setOutputImage: (url: string) => {
          set((state) => {
            if (state.outputUrl) URL.revokeObjectURL(state.outputUrl);
            return { outputUrl: url };
          });
        },
        setCurrentImage: (url: string | null) => {
          set((state) => {
            if (state.currentImage) URL.revokeObjectURL(state.currentImage);
            return { currentImage: url };
          });
        },
        updateCrop: (crop) => set({ crop }),
        updateZoom: (zoom) => set({ zoom }),
        updateRotation: (rotation) => set({ rotation }),
        updateAspect: (aspect) => set({ aspect }),
        setCroppedAreaPixels: (pixels) => set({ croppedAreaPixels: pixels }),
        setIsCropping: (isCropping) => set({ isCropping }),
        updateDimensions: (width, height) => set({ width, height }),
        setFlipH: (flipH) => set({ flipH }),
        setFlipV: (flipV) => set({ flipV }),
        setFilter: (filter) => set({ filter }),
        updateTextOverlay: (text, color, size, x, y) => {
          set({
            textOverlay: text,
            textColor: color,
            textSize: size,
            textX: x,
            textY: y,
          });
        },
        setAiPrompt: (prompt) => set({ aiPrompt: prompt }),
        setAiLoading: (loading) => set({ aiLoading: loading }),
        setAiError: (error) => set({ aiError: error }),
        setGeneratedImages: (images) => set({ generatedImages: images }),
        setShowAiPanel: (show) => set({ showAiPanel: show }),
        setAiModel: (model) => set({ aiModel: model }),
        setAspectRatio: (ratio) => set({ aspectRatio: ratio }),
        setNumberOfImages: (count) => set({ numberOfImages: count }),
        setCharacterConsistency: (enabled) => set({ characterConsistency: enabled }),
        setMultiImageFusion: (enabled) => set({ multiImageFusion: enabled }),
        setWorldKnowledge: (enabled) => set({ worldKnowledge: enabled }),
        setUploadedImages: (images) => set({ uploadedImages: images }),
        setShowGeneratedImages: (show) => set({ showGeneratedImages: show }),
        setInputModalOpen: (open) => set({ inputModalOpen: open }),
        setLoading: (loading) => set({ loading }),
        resetManipulationStates: () => {
          set({
            crop: { x: 0, y: 0 },
            zoom: 1,
            rotation: 0,
            aspect: undefined,
            isCropping: false,
            width: 'auto',
            height: 'auto',
            flipH: false,
            flipV: false,
            filter: 'none',
            textOverlay: '',
            textColor: '#ffffff',
            textSize: 24,
            textX: 50,
            textY: 50,
          });
        },
        resetAllStates: () => {
          set((state) => {
            // Clean up URLs
            if (state.inputUrl) URL.revokeObjectURL(state.inputUrl);
            if (state.outputUrl) URL.revokeObjectURL(state.outputUrl);
            if (state.currentImage) URL.revokeObjectURL(state.currentImage);
            state.generatedImages.forEach(url => URL.revokeObjectURL(url));
            
            return {
              ...initialState,
              history: [],
              historyIndex: -1,
            };
          });
        },
        saveToHistory: () => {
          set((state) => {
            const newHistory = state.history.slice(0, state.historyIndex + 1);
            newHistory.push({
              currentImage: state.currentImage,
              crop: state.crop,
              zoom: state.zoom,
              rotation: state.rotation,
            });
            
            return {
              history: newHistory,
              historyIndex: newHistory.length - 1,
            };
          });
        },
        undo: () => {
          set((state) => {
            if (state.historyIndex > 0) {
              const previousState = state.history[state.historyIndex - 1];
              return {
                ...state,
                ...previousState,
                historyIndex: state.historyIndex - 1,
              };
            }
            return state;
          });
        },
        redo: () => {
          set((state) => {
            if (state.historyIndex < state.history.length - 1) {
              const nextState = state.history[state.historyIndex + 1];
              return {
                ...state,
                ...nextState,
                historyIndex: state.historyIndex + 1,
              };
            }
            return state;
          });
        },
        canUndo: () => get().historyIndex > 0,
        canRedo: () => get().historyIndex < get().history.length - 1,
      }),
      {
        name: 'image-editor-storage',
        onRehydrateStorage: (state) => {
          console.log('hydration starts');
          if (state) {
            state.history = [];
            state.historyIndex = -1;
          }
        },
      }
    )
  )
);

