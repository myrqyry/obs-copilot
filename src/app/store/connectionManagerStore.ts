// Alias for legacy import paths — keep compatibility with components importing useConnectionManagerStore
import useConnectionsStore from './connections';
import { obsClient, ObsClientImpl as ObsClient } from '@/shared/services/obsClient';

/**
 * Compatibility wrapper for legacy `useConnectionManagerStore` usages.
 * - If called with a selector function, proxy directly to the underlying zustand selector.
 * - If called without args, return the full store augmented with a safe `actions` object.
 *
 * The `actions` object provides sensible no-op fallbacks where the original implementation
 * exposed runtime helpers (e.g. uploadLog, handleObsAction). When the real obsClientInstance
 * is available, the wrapper will attempt to call the corresponding method on it.
 *
 * This shim keeps the codebase compiling while we iteratively restore the
 * full, featureful connection manager API.
 */
export const useConnectionManagerStore = (selector?: any) => {
  // If a selector is provided (common pattern: useConnectionManagerStore(s => s.foo)),
  // forward it to the underlying store.
  if (typeof selector === 'function') {
    return useConnectionsStore(selector);
  }

  // Otherwise return full state augmented with `actions`.
  const base = useConnectionsStore();

  const actions = {
    // Attempt to proxy to obsClient methods if available; otherwise no-op.
    async uploadLog() {
      try {
        if (obsClient && typeof (obsClient as any).uploadLog === 'function') {
          return await (obsClient as any).uploadLog();
        }
      } catch (e) {
        // swallow - caller code already handles failures
      }
      return { success: false, message: 'upload not available' };
    },
    handleObsAction: async (...args: any[]) => {
      if (base.obs && typeof (base.obs as any).handleObsAction === 'function') {
        return (base.obs as any).handleObsAction(...args);
      }
      return null;
    },
    // Placeholder for any other action the UI expects — keep as no-ops to satisfy destructuring.
    noop: () => {},
  };

  return {
    ...base,
    actions,
  } as any;
};

export default useConnectionManagerStore;