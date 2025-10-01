import { useEffect, useRef } from 'react';

interface LifecycleOptions {
  onMount?: () => void;
  onUnmount?: () => void;
  onUpdate?: () => void;
  dependencies?: React.DependencyList;
}

/**
 * A custom hook to manage component/hook lifecycle events.
 * Provides callbacks for mount, unmount, and update phases,
 * with optional dependencies for updates.
 *
 * @param options Configuration options for lifecycle callbacks.
 */
export function useLifecycleManagement(options: LifecycleOptions) {
  const { onMount, onUnmount, onUpdate, dependencies = [] } = options;

  const isMounted = useRef(false);

  // Mount effect
  useEffect(() => {
    if (!isMounted.current) {
      onMount?.();
      isMounted.current = true;
    }

    // Unmount effect
    return () => {
      onUnmount?.();
      isMounted.current = false;
    };
  }, [onMount, onUnmount]);

  // Update effect
  useEffect(() => {
    if (isMounted.current) {
      onUpdate?.();
    }
  }, [onUpdate, ...dependencies]);
}
