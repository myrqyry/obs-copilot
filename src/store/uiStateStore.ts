import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Modal/Dialog state management
interface ModalState {
  id: string;
  isOpen: boolean;
  title?: string;
  content?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClose?: () => void;
  actions?: React.ReactNode;
}

// Loading state for different operations
interface LoadingState {
  id: string;
  isLoading: boolean;
  message?: string;
  progress?: number;
}

// Error state management
interface ErrorState {
  id: string;
  message: string;
  source: string;
  timestamp: number;
  level: 'critical' | 'error' | 'warning' | 'info';
  retry?: () => void;
  details?: Record<string, any>;
}

// Image editor state
interface ImageEditorState {
  // Input/Output
  inputUrl: string | null;
  outputUrl: string | null;
  inputBlob: Blob | null;
  currentImage: string | null;
  
  // Manipulation states
  crop: { x: number; y: number };
  zoom: number;
  rotation: number;
  aspect: number | undefined;
  croppedAreaPixels: any;
  isCropping: boolean;
  width: number | string;
  height: number | string;
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
  uploadedImages: any[];
  showGeneratedImages: boolean;
  
  // UI states
  inputModalOpen: boolean;
  loading: boolean;
}

// Collapsible sections state
interface CollapsibleState {
  [key: string]: boolean;
}

// Form states
interface FormState {
  [formId: string]: {
    values: Record<string, any>;
    errors: Record<string, string>;
    touched: Record<string, boolean>;
    isSubmitting: boolean;
  };
}

export interface UIStateStore {
  // Modal management
  modals: ModalState[];
  openModal: (modal: Omit<ModalState, 'isOpen'>) => string;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  
  // Loading management
  loadingStates: LoadingState[];
  setLoading: (id: string, isLoading: boolean, message?: string, progress?: number) => void;
  clearLoading: (id: string) => void;
  clearAllLoading: () => void;
  
  // Error management
  errors: ErrorState[];
  addError: (error: Omit<ErrorState, 'id' | 'timestamp'>) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
  clearErrorsBySource: (source: string) => void;
  
  // Image editor state
  imageEditor: ImageEditorState;
  updateImageEditor: (updates: Partial<ImageEditorState>) => void;
  resetImageEditor: () => void;
  
  // Collapsible sections
  collapsibleStates: CollapsibleState;
  toggleCollapsible: (key: string) => void;
  setCollapsible: (key: string, isOpen: boolean) => void;
  
  // Form management
  forms: FormState;
  updateForm: (formId: string, updates: Partial<FormState[string]>) => void;
  resetForm: (formId: string) => void;
  
  // Global UI state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  
  // Theme and appearance
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
}

const initialImageEditorState: ImageEditorState = {
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
};

export const useUIStateStore = create<UIStateStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Modal management
        modals: [],
        openModal: (modal) => {
          const id = modal.id || `modal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          set((state) => ({
            modals: [...state.modals.filter(m => m.id !== id), { ...modal, id, isOpen: true }]
          }));
          return id;
        },
        closeModal: (id) => {
          set((state) => ({
            modals: state.modals.map(m => m.id === id ? { ...m, isOpen: false } : m)
          }));
        },
        closeAllModals: () => {
          set((state) => ({
            modals: state.modals.map(m => ({ ...m, isOpen: false }))
          }));
        },
        
        // Loading management
        loadingStates: [],
        setLoading: (id, isLoading, message, progress) => {
          set((state) => {
            const existing = state.loadingStates.find(l => l.id === id);
            if (existing) {
              return {
                loadingStates: state.loadingStates.map(l => 
                  l.id === id ? { ...l, isLoading, message, progress } : l
                )
              };
            } else {
              return {
                loadingStates: [...state.loadingStates, { id, isLoading, message, progress }]
              };
            }
          });
        },
        clearLoading: (id) => {
          set((state) => ({
            loadingStates: state.loadingStates.filter(l => l.id !== id)
          }));
        },
        clearAllLoading: () => {
          set({ loadingStates: [] });
        },
        
        // Error management
        errors: [],
        addError: (errorData) => {
          const id = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const error: ErrorState = {
            ...errorData,
            id,
            timestamp: Date.now(),
          };
          set((state) => ({ errors: [...state.errors, error] }));
        },
        removeError: (id) => {
          set((state) => ({
            errors: state.errors.filter(e => e.id !== id)
          }));
        },
        clearErrors: () => {
          set({ errors: [] });
        },
        clearErrorsBySource: (source) => {
          set((state) => ({
            errors: state.errors.filter(e => e.source !== source)
          }));
        },
        
        // Image editor state
        imageEditor: initialImageEditorState,
        updateImageEditor: (updates) => {
          set((state) => ({
            imageEditor: { ...state.imageEditor, ...updates }
          }));
        },
        resetImageEditor: () => {
          set({ imageEditor: initialImageEditorState });
        },
        
        // Collapsible sections
        collapsibleStates: {},
        toggleCollapsible: (key) => {
          set((state) => ({
            collapsibleStates: {
              ...state.collapsibleStates,
              [key]: !state.collapsibleStates[key]
            }
          }));
        },
        setCollapsible: (key, isOpen) => {
          set((state) => ({
            collapsibleStates: {
              ...state.collapsibleStates,
              [key]: isOpen
            }
          }));
        },
        
        // Form management
        forms: {},
        updateForm: (formId, updates) => {
          set((state) => ({
            forms: {
              ...state.forms,
              [formId]: {
                ...state.forms[formId],
                ...updates
              }
            }
          }));
        },
        resetForm: (formId) => {
          set((state) => {
            const { [formId]: removed, ...rest } = state.forms;
            return { forms: rest };
          });
        },
        
        // Global UI state
        sidebarOpen: true,
        setSidebarOpen: (open) => {
          set({ sidebarOpen: open });
        },
        
        // Theme
        darkMode: false,
        setDarkMode: (dark) => {
          set({ darkMode: dark });
        },
      }),
      {
        name: 'ui-state-store',
        partialize: (state) => ({
          collapsibleStates: state.collapsibleStates,
          sidebarOpen: state.sidebarOpen,
          darkMode: state.darkMode,
        }),
      }
    ),
    {
      name: 'ui-state-store',
    }
  )
);

// Selectors for common use cases
export const useModal = (id: string) => {
  return useUIStateStore((state) => 
    state.modals.find(m => m.id === id)
  );
};

export const useLoading = (id: string) => {
  return useUIStateStore((state) => 
    state.loadingStates.find(l => l.id === id)
  );
};

export const useImageEditor = () => {
  return useUIStateStore((state) => state.imageEditor);
};

export const useCollapsible = (key: string) => {
  return useUIStateStore((state) => state.collapsibleStates[key] || false);
};
