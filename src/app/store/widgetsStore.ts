import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { UniversalWidgetConfig, WidgetState } from '@/shared/types/universalWidget';
import { obsClient } from '@/shared/services/obsClient';
import { eventSubscriptionManager } from '@/shared/services/eventSubscriptionManager';
import { logger } from '@/shared/utils/logger';

interface WidgetStoreState {
  widgets: Record<string, { config: UniversalWidgetConfig; state: WidgetState }>;
  isLoading: boolean;
  lastSyncTime?: number | null;
  syncError?: string | null;
}

interface WidgetStoreActions {
  addWidget: (config: UniversalWidgetConfig) => void;
  updateWidgetConfig: (id: string, updates: Partial<UniversalWidgetConfig>) => void;
  updateWidgetState: (id: string, updates: Partial<WidgetState>) => void;
  removeWidget: (id: string) => void;
  subscribeToEvents: (widgetId: string, events: string[]) => void;
  unsubscribeFromEvents: (widgetId: string, events: string[]) => void;
  syncAllWidgets: () => Promise<void>;
  clearWidgets: () => void;
}

type WidgetStore = WidgetStoreState & WidgetStoreActions;

const createWidgetState = (config: UniversalWidgetConfig): WidgetState => ({
  id: config.id,
  value: config.valueMapping?.defaultValue ?? null,
  isActive: false,
  isLoading: false,
  isDirty: false,
  error: undefined,
  lastUpdated: Date.now(),
  lastSynced: 0,
});

export const useWidgetsStore = create<WidgetStore>()(
  devtools(
    persist(
      (set, get) => ({
      widgets: {},
      isLoading: false,
      lastSyncTime: null,
      syncError: null,
      addWidget: (config) => {
        const initialState = createWidgetState(config);
        set((state) => ({
          widgets: {
            ...state.widgets,
            [config.id]: { config, state: initialState },
          },
        }));
        // Subscribe to events if specified
        if (config.eventSubscriptions?.length > 0) {
          // eventSubscriptionManager.subscribeToEvents(config.id, config.eventSubscriptions);
        }
      },
      updateWidgetConfig: (id, updates) => {
        set((state) => ({
          widgets: {
            ...state.widgets,
            [id]: {
              ...state.widgets[id],
              config: { ...state.widgets[id].config, ...updates },
            },
          },
        }));
      },
      updateWidgetState: (id, updates) => {
        set((state) => ({
          widgets: {
            ...state.widgets,
            [id]: {
              ...state.widgets[id],
              state: { ...state.widgets[id].state, ...updates, lastUpdated: Date.now() },
            },
          },
        }));
      },
      removeWidget: (id) => {
        set((state) => {
          const { [id]: removed, ...widgets } = state.widgets;
          // Unsubscribe events
          const config = removed.config;
          if (config.eventSubscriptions?.length > 0) {
            // eventSubscriptionManager.unsubscribeFromEvents(id, config.eventSubscriptions);
          }
          return { widgets };
        });
      },
      subscribeToEvents: (widgetId, _events) => {
        // eventSubscriptionManager.subscribeToEvents(widgetId, _events);
        logger.info(`[widgetsStore] Subscribed to events for widget ${widgetId}`);
      },
      unsubscribeFromEvents: (widgetId, _events) => {
        // eventSubscriptionManager.unsubscribeFromEvents(widgetId, _events);
        logger.info(`[widgetsStore] Unsubscribed from events for widget ${widgetId}`);
      },
      syncAllWidgets: async () => {
        set({ isLoading: true, syncError: null });
        try {
          const { widgets } = get();
          for (const [id, { config }] of Object.entries(widgets)) {
            try {
              // Basic sync logic; enhance based on specific config
              if (config.targetType === 'input' && config.property === 'volume_db') {
                const response = await obsClient.executeWidgetAction(config, null); // Get current value
                // Note: executeWidgetAction currently sets value, but for sync we need get
                // For now, assume we can get value from event or separate get method
                // Placeholder: get().updateWidgetState(id, { value: response?.inputVolumeDb || 0 });
              }
            } catch (error) {
              logger.error(`Sync failed for widget ${id}:`, error);
            }
          }
          set({ lastSyncTime: Date.now() });
        } catch (error) {
          logger.error('Sync all widgets failed:', error);
          set({ syncError: error instanceof Error ? error.message : 'Sync failed' });
        } finally {
          set({ isLoading: false });
        }
      },
      clearWidgets: () => {
        set({ widgets: {} });
      },
      }),
      {
        name: 'widgetsStore',
        storage: {
          getItem: (name: string) => Promise.resolve(localStorage.getItem(name)),
          setItem: (name: string, value: string) => Promise.resolve(localStorage.setItem(name, value)),
          removeItem: (name: string) => Promise.resolve(localStorage.removeItem(name)),
        },
        partialize: (state) => ({ widgets: state.widgets, isLoading: state.isLoading }),
      }
    ),
    { name: 'widgetsStore-dev' }
  )
);

export default useWidgetsStore;