import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

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
  history: ImageEditorState[];
  historyIndex: number;
  
  // Actions
  setInputImage: (url: string, blob: Blob) => void;
  setOutputImage: (url: string) => void;
  setCurrentImage: (url: string | null) => void;
  updateCrop: (crop: { x: number; y: number }) => void;
  updateZoom: (zoom: number) => void;
  updateRotation: (rotation: number) => void;
  updateAspect: (aspect: number | undefined) => void;
  setCroppedAreaPixels: (pixels: any) => void;
  setIsCropping: (isCropping: boolean) => void;
  updateDimensions: (width: number | string, height: number | string) => void;
  setFlipH: (flipH: boolean) => void;
  setFlipV: (flipV: boolean) => void;
  setFilter: (filter: string) => void;
  updateTextOverlay: (text: string, color: string, size: number, x: number, y: number) => void;
  setAiPrompt: (prompt: string) => void;
  setAiLoading: (loading: boolean) => void;
  setAiError: (error: string | null) => void;
  setGeneratedImages: (images: string[]) => void;
  setShowAiPanel: (show: boolean) => void;
  setAiModel: (model: string) => void;
  setAspectRatio: (ratio: string) => void;
  setNumberOfImages: (count: number) => void;
  setCharacterConsistency: (enabled: boolean) => void;
  setMultiImageFusion: (enabled: boolean) => void;
  setWorldKnowledge: (enabled: boolean) => void;
  setUploadedImages: (images: ImageUploadResult[]) => void;
  setShowGeneratedImages: (show: boolean) => void;
  setInputModalOpen: (open: boolean) => void;
  setLoading: (loading: boolean) => void;
  resetManipulationStates: () => void;
  resetAllStates: () => void;
  saveToHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
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
  
  // Actions
  setInputImage: (url, blob) => {
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
        ...state,
      };
    });
  },
  
  setOutputImage: (url) => {
    set((state) => {
      if (state.outputUrl) URL.revokeObjectURL(state.outputUrl);
      return { outputUrl: url };
    });
  },
  
  setCurrentImage: (url) => {
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
        inputUrl: state.inputUrl,
        outputUrl: state.outputUrl,
        inputBlob: state.inputBlob,
        currentImage: state.currentImage,
        crop: state.crop,
        zoom: state.zoom,
        rotation: state.rotation,
        aspect: state.aspect,
        croppedAreaPixels: state.croppedAreaPixels,
        isCropping: state.isCropping,
        width: state.width,
        height: state.height,
        flipH: state.flipH,
        flipV: state.flipV,
        filter: state.filter,
        textOverlay: state.textOverlay,
        textColor: state.textColor,
        textSize: state.textSize,
        textX: state.textX,
        textY: state.textY,
        aiPrompt: state.aiPrompt,
        aiLoading: state.aiLoading,
        aiError: state.aiError,
        generatedImages: [...state.generatedImages],
        showAiPanel: state.showAiPanel,
        aiModel: state.aiModel,
        aspectRatio: state.aspectRatio,
        numberOfImages: state.numberOfImages,
        characterConsistency: state.characterConsistency,
        multiImageFusion: state.multiImageFusion,
        worldKnowledge: state.worldKnowledge,
        uploadedImages: [...state.uploadedImages],
        showGeneratedImages: state.showGeneratedImages,
        inputModalOpen: state.inputModalOpen,
        loading: state.loading,
        history: [],
        historyIndex: -1,
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
  
  canUndo: () => {
    const state = get();
    return state.historyIndex > 0;
  },
  
  canRedo: () => {
    const state = get();
    return state.historyIndex < state.history.length - 1;
  },
};

export const useImageEditorStore = create<ImageEditorState>()(
  devtools(
    (set, get) => ({
      ...initialState,
    }),
    {
      name: 'image-editor-store',
    }
  )
);

// Selectors for common use cases
export const useImageEditorInput = () => {
  return useImageEditorStore((state) => ({
    inputUrl: state.inputUrl,
    inputBlob: state.inputBlob,
    currentImage: state.currentImage,
    setInputImage: state.setInputImage,
    setCurrentImage: state.setCurrentImage,
  }));
};

export const useImageEditorManipulation = () => {
  return useImageEditorStore((state) => ({
    crop: state.crop,
    zoom: state.zoom,
    rotation: state.rotation,
    aspect: state.aspect,
    isCropping: state.isCropping,
    width: state.width,
    height: state.height,
    flipH: state.flipH,
    flipV: state.flipV,
    filter: state.filter,
    updateCrop: state.updateCrop,
    updateZoom: state.updateZoom,
    updateRotation: state.updateRotation,
    updateAspect: state.updateAspect,
    setIsCropping: state.setIsCropping,
    updateDimensions: state.updateDimensions,
    setFlipH: state.setFlipH,
    setFlipV: state.setFlipV,
    setFilter: state.setFilter,
    resetManipulationStates: state.resetManipulationStates,
  }));
};

export const useImageEditorAI = () => {
  return useImageEditorStore((state) => ({
    aiPrompt: state.aiPrompt,
    aiLoading: state.aiLoading,
    aiError: state.aiError,
    generatedImages: state.generatedImages,
    showAiPanel: state.showAiPanel,
    aiModel: state.aiModel,
    aspectRatio: state.aspectRatio,
    numberOfImages: state.numberOfImages,
    characterConsistency: state.characterConsistency,
    multiImageFusion: state.multiImageFusion,
    worldKnowledge: state.worldKnowledge,
    uploadedImages: state.uploadedImages,
    showGeneratedImages: state.showGeneratedImages,
    setAiPrompt: state.setAiPrompt,
    setAiLoading: state.setAiLoading,
    setAiError: state.setAiError,
    setGeneratedImages: state.setGeneratedImages,
    setShowAiPanel: state.setShowAiPanel,
    setAiModel: state.setAiModel,
    setAspectRatio: state.setAspectRatio,
    setNumberOfImages: state.setNumberOfImages,
    setCharacterConsistency: state.setCharacterConsistency,
    setMultiImageFusion: state.setMultiImageFusion,
    setWorldKnowledge: state.setWorldKnowledge,
    setUploadedImages: state.setUploadedImages,
    setShowGeneratedImages: state.setShowGeneratedImages,
  }));
};
