import React, { useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { UniversalWidgetConfig } from '@/types/universalWidget';
import { useWidgetStore } from './widgetStore';
import { ObsClientImpl } from '@/services/obsClient';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { Button } from '@/components/ui/button'; // Example primitive, adjust as needed

const obsClient = ObsClientImpl.getInstance();

interface BaseWidgetProps {
  config: UniversalWidgetConfig;
  children?: ReactNode;
}

export const BaseWidget: React.FC<BaseWidgetProps> = ({ config, children }) => {
  const { id, eventSubscriptions } = config;
  const { updateWidgetState, subscribeToEvents, unsubscribeFromEvents } = useWidgetStore();
  const [isMounted, setIsMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoized state sync function for performance
  const syncState = useCallback((newState: any) => {
    updateWidgetState(id, newState);
  }, [id, updateWidgetState]);

  // Memoized event handler
  const handleEvent = useCallback((eventData: any) => {
    // Basic event processing and state sync
    if (eventData && eventData.update) {
      syncState(eventData.update);
    }
    // Add error handling
    if (eventData.error) {
      setError(eventData.error);
    }
  }, [syncState]);

  // Subscribe to events on mount
  useEffect(() => {
    if (!isMounted || !eventSubscriptions?.length) return;

    const subscriptionIds = eventSubscriptions.map((event) => 
      subscribeToEvents(event, handleEvent)
    );

    return () => {
      subscriptionIds.forEach((subId) => unsubscribeFromEvents(subId));
    };
  }, [isMounted, eventSubscriptions, subscribeToEvents, unsubscribeFromEvents, handleEvent]);

  // Initial state sync
  useEffect(() => {
    setIsMounted(true);
    // Fetch initial state if needed
    syncState({ mounted: true });
  }, [syncState]);

  // Performance optimization: memoize rendered children
  const renderedChildren = useMemo(() => {
    if (error) {
      return (
        <div className="p-2 bg-red-100 text-red-700 rounded">
          Error: {error}
          <Button onClick={() => setError(null)} size="sm" className="ml-2">
            Retry
          </Button>
        </div>
      );
    }
    return children;
  }, [children, error]);

  return (
    <ErrorBoundary fallback={<div className="text-red-500">Widget Error Boundary Fallback</div>}>
      <div className="base-widget p-2 border rounded bg-background">
        {renderedChildren}
      </div>
    </ErrorBoundary>
  );
};