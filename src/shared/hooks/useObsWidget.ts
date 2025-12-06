import { useEffect, useState, useCallback, useRef } from 'react';
import { geminiService } from '@/shared/services/geminiService';
import { useWidgetsStore } from '@/app/store/widgetsStore';
import { obsClient } from '@/shared/services/obsClient';
import { eventSubscriptionManager } from '@/shared/services/eventSubscriptionManager';
import { UniversalWidgetConfig } from '@/shared/types/universalWidget';
import { widgetDiscoveryService } from '@/shared/services/widgetDiscovery';
import { logger } from '@/shared/utils/logger';
import { v4 as uuidv4 } from 'uuid';

// Simple debounce hook (if not available elsewhere)
function useDebounce<T extends (...args: any[]) => any>(callback: T, delay: number) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

export const useObsWidget = (config: UniversalWidgetConfig) => {
  const { updateWidgetState, subscribeToEvents, unsubscribeFromEvents } = useWidgetsStore();
  const [options, setOptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load prefill options based on targetType
  useEffect(() => {
    const loadOptions = async () => {
      if (!config.targetType) return;
      setIsLoading(true);
      try {
        const opts = await widgetDiscoveryService.discoverTargets(config.targetType);
        setOptions(opts);
        if (opts.length > 0 && !config.targetName) {
          updateWidgetState(config.id, { value: opts[0] });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load options');
        logger.error('useObsWidget: Failed to discover targets:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadOptions();
  }, [config.targetType, config.id]);

  // Subscribe to events for real-time updates
  useEffect(() => {
    if (config.eventSubscriptions && config.eventSubscriptions.length > 0) {
      subscribeToEvents(config.id, config.eventSubscriptions);
      return () => {
        unsubscribeFromEvents(config.id, config.eventSubscriptions!);
      };
    }
  }, [config.id, config.eventSubscriptions]);

  // Execute action function
  const executeAction = async (value: any) => {
    try {
      await obsClient.executeWidgetAction(config, value);
      // Update state after successful execution
      updateWidgetState(config.id, { value, isLoading: false });
    } catch (err) {
      logger.error('useObsWidget: Action execution failed:', err);
      updateWidgetState(config.id, { error: err instanceof Error ? err.message : 'Action failed' });
    }
  };

  // Debounce execution if performance config specifies
  const debouncedExecute = useDebounce(executeAction, config.performance?.debounce || 0);

  // AI-assisted config generation
  const generateConfig = useCallback(async (description: string): Promise<UniversalWidgetConfig> => {
    try {
      logger.info(`Generating widget config from description: ${description}`);
      
      const generatedConfig = await geminiService.generateWidgetConfigFromPrompt(description);
      
      // Ensure ID is unique
      generatedConfig.id = uuidv4();
      
      // Add to store
      useWidgetsStore.getState().addWidget(generatedConfig);
      
      logger.info('Widget config generated and added to store:', generatedConfig.id);
      
      return generatedConfig;
    } catch (error) {
      logger.error('Failed to generate widget config:', error);
      throw new Error(`AI configuration generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  return {
    options,
    isLoading,
    error,
    executeAction: debouncedExecute,
    updateState: (updates: any) => updateWidgetState(config.id, updates),
    generateConfig,
  };
};