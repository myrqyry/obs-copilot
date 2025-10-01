import { create } from 'zustand';
import useSettingsStore from './settingsStore';
import { OverlayConfig } from '@/types/overlay';
import { generateOverlay } from '@/services/overlayService';
import { generateChatOverlayHTML, saveChatOverlayHTML } from '@/lib/chatOverlayUtils';
import type { ChatBackgroundType, ChatPattern } from '@/types/chatBackground';

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
  regenerateChatOverlay: () => Promise<void>;
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
      addOverlay(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate overlay');
    } finally {
      setLoading(false);
    }
  },

  regenerateChatOverlay: async () => {
    const { setLoading, setError } = get();
    const settings = useSettingsStore.getState();
    setLoading(true);
    setError(null);
    try {
      const html = generateChatOverlayHTML(
        settings.chatBackgroundType,
        settings.customChatBackground,
        settings.chatPattern
      );
      await saveChatOverlayHTML(html);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate chat overlay');
    } finally {
      setLoading(false);
    }
  },
}));