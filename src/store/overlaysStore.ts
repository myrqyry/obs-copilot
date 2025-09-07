import { create } from 'zustand';
import { OverlayConfig } from '@/types/overlay';
import { generateOverlay } from '@/services/overlayService';

interface OverlaysState {
  overlays: OverlayConfig[];
  currentTemplate: string;
  loading: boolean;
  error: string | null;
}

interface OverlaysActions {
  addOverlay: (config: OverlayConfig) => void;
  updateOverlay: (id: string, config: Partial<OverlayConfig>) => void;
  removeOverlay: (id: string) => void;
  setCurrentTemplate: (template: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  generateOverlay: (templateName: string, description: string) => Promise<void>;
}

type OverlaysStore = OverlaysState & OverlaysActions;

export const useOverlaysStore = create<OverlaysStore>((set, get) => ({
  overlays: [],
  currentTemplate: '',
  loading: false,
  error: null,

  addOverlay: (config) => set((state) => ({ overlays: [...state.overlays, config] })),

  updateOverlay: (id, config) =>
    set((state) => ({
      overlays: state.overlays.map((overlay) =>
        overlay.id === id ? { ...overlay, ...config } : overlay
      ),
    })),

  removeOverlay: (id) =>
    set((state) => ({
      overlays: state.overlays.filter((overlay) => overlay.id !== id),
    })),

  setCurrentTemplate: (template) => set({ currentTemplate: template }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  generateOverlay: async (templateName, description) => {
    const { setLoading, setError, addOverlay } = get();
    setLoading(true);
    setError(null);
    try {
      const result = await generateOverlay(templateName, description);
      addOverlay(result.config);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate overlay');
    } finally {
      setLoading(false);
    }
  },
}));