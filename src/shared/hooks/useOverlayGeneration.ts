import { useOverlaysStore } from '@/app/store/overlaysStore';
import { OverlayConfig } from '@/shared/types/overlay';

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