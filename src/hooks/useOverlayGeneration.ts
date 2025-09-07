import { useOverlaysStore } from '@/store/overlaysStore';
import { OverlayConfig } from '@/types/overlay';

export function useOverlayGeneration() {
  const {
    overlays,
    currentTemplate,
    loading,
    error,
    addOverlay,
    updateOverlay,
    removeOverlay,
    setCurrentTemplate,
    generateOverlay,
    setLoading,
    setError,
  } = useOverlaysStore();

  return {
    overlays,
    currentTemplate,
    loading,
    error,
    addOverlay,
    updateOverlay,
    removeOverlay,
    setCurrentTemplate,
    generateOverlay,
    setLoading,
    setError,
  };
}