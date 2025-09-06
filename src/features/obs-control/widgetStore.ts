import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { UniversalWidgetConfig, WidgetState, WidgetContext, WidgetError } from './types';
import { widgetEngine } from './UniversalWidgetEngine';
// Remove immer dependency - we'll use manual state updates

/**
 * Widget Store - Centralized state management for all OBS widgets
 * Provides real-time state synchronization, persistence, and reactive updates
 */
export interface WidgetStoreState {
  // Widget registry
  widgets: Map<string, WidgetContext>;
  widgetConfigs: Map<string, UniversalWidgetConfig>;
  
  // UI state
  selectedWidgetId: string | null;
  widgetGroups: WidgetGroup[];
  activeDashboard: string | null;
  
  // Performance and monitoring
  isLoading: boolean;
  error: WidgetError | null;
  lastSyncTime: number | null;
  
  // Actions
  registerWidget: (config: UniversalWidgetConfig) => Promise<void>;
  unregisterWidget: (widgetId: string) => Promise<void>;
  updateWidgetConfig: (widgetId: string, config: Partial<UniversalWidgetConfig>) => void;
  updateWidgetState: (widgetId: string, state: Partial<WidgetState>) => void;
  selectWidget: (widgetId: string | null) => void;
  createWidgetGroup: (group: WidgetGroup) => void;
  updateWidgetGroup: (groupId: string, updates: Partial<WidgetGroup>) => void;
  deleteWidgetGroup: (groupId: string) => void;
  setActiveDashboard: (dashboardId: string | null) => void;
  syncWidgetState: (widgetId: string) => Promise<void>;
  syncAllWidgets: () => Promise<void>;
  clearError: () => void;
  
  // Getters
  getWidget: (widgetId: string) => WidgetContext | undefined;
  getWidgetConfig: (widgetId: string) => UniversalWidgetConfig | undefined;
  getWidgetsByType: (controlType: string) => WidgetContext[];
  getWidgetsByGroup: (groupId: string) => WidgetContext[];
  getActiveWidgets: () => WidgetContext[];
  getWidgetMetrics: (widgetId: string) => any;
}

export interface WidgetGroup {
  id: string;
  name: string;
  description?: string;
  widgetIds: string[];
  layout: WidgetLayout;
  theme?: WidgetTheme;
  isVisible: boolean;
  order: number;
}

export interface WidgetLayout {
  type: 'grid' | 'flex' | 'absolute';
  columns?: number;
  rows?: number;
  gap?: number;
  padding?: number;
}

export interface WidgetTheme {
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: number;
  fontSize?: number;
}

// Create the widget store with Zustand
export const useWidgetStore = create<WidgetStoreState>()(
  devtools(
    subscribeWithSelector(
      (set, get) => ({
        // Initial state
        widgets: new Map(),
        widgetConfigs: new Map(),
        selectedWidgetId: null,
        widgetGroups: [],
        activeDashboard: null,
        isLoading: false,
        error: null,
        lastSyncTime: null,

        // Register a new widget
        registerWidget: async (config: UniversalWidgetConfig) => {
          set({ isLoading: true, error: null });
          
          try {
            // Register with the widget engine
            const context = await widgetEngine.registerWidget(config);
            
            set(
              (state) => ({
                ...state,
                widgets: new Map(state.widgets).set(config.id, context),
                widgetConfigs: new Map(state.widgetConfigs).set(config.id, config),
                isLoading: false,
                lastSyncTime: Date.now()
              })
            );
            
            console.log(`[WidgetStore] Widget registered: ${config.id}`);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to register widget';
            const widgetError = new WidgetError(errorMessage, 'REGISTRATION_FAILED');
            set({
              error: widgetError,
              isLoading: false
            });
            console.error(`[WidgetStore] Failed to register widget: ${config.id}`, error);
            throw widgetError;
          }
        },

        // Unregister a widget
        unregisterWidget: async (widgetId: string) => {
          try {
            // Unregister from the widget engine
            await widgetEngine.unregisterWidget(widgetId);
            
            set(
              (state) => {
                const newWidgets = new Map(state.widgets);
                const newConfigs = new Map(state.widgetConfigs);
                newWidgets.delete(widgetId);
                newConfigs.delete(widgetId);
                
                return {
                  ...state,
                  widgets: newWidgets,
                  widgetConfigs: newConfigs,
                  widgetGroups: state.widgetGroups.map(group => ({
                    ...group,
                    widgetIds: group.widgetIds.filter(id => id !== widgetId)
                  })),
                  selectedWidgetId: state.selectedWidgetId === widgetId ? null : state.selectedWidgetId,
                  lastSyncTime: Date.now()
                };
              }
            );
            
            console.log(`[WidgetStore] Widget unregistered: ${widgetId}`);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to unregister widget';
            const widgetError = new WidgetError(errorMessage, 'UNREGISTRATION_FAILED');
            set({ error: widgetError });
            console.error(`[WidgetStore] Failed to unregister widget: ${widgetId}`, error);
            throw widgetError;
          }
        },

        // Update widget configuration
        updateWidgetConfig: (widgetId: string, config: Partial<UniversalWidgetConfig>) => {
          set(
            (state) => {
              const existingConfig = state.widgetConfigs.get(widgetId);
              if (existingConfig) {
                return {
                  ...state,
                  widgetConfigs: new Map(state.widgetConfigs).set(widgetId, { ...existingConfig, ...config }),
                  lastSyncTime: Date.now()
                };
              }
              return state;
            }
          );
        },

        // Update widget state
        updateWidgetState: (widgetId: string, updates: Partial<WidgetState>) => {
          set(
            (state) => {
              const context = state.widgets.get(widgetId);
              if (context) {
                const newWidgets = new Map(state.widgets);
                const updatedContext: WidgetContext = {
                  ...context,
                  state: { ...context.state, ...updates }
                };
                newWidgets.set(widgetId, updatedContext);
                return {
                  ...state,
                  widgets: newWidgets,
                  lastSyncTime: Date.now()
                };
              }
              return state;
            }
          );
        },

        // Select a widget
        selectWidget: (widgetId: string | null) => {
          set({ selectedWidgetId: widgetId });
        },

        // Create a widget group
        createWidgetGroup: (group: WidgetGroup) => {
          set(
            (state) => ({
              ...state,
              widgetGroups: [...state.widgetGroups, group],
              lastSyncTime: Date.now()
            })
          );
        },

        // Update a widget group
        updateWidgetGroup: (groupId: string, updates: Partial<WidgetGroup>) => {
          set(
            (state) => {
              const index = state.widgetGroups.findIndex(g => g.id === groupId);
              if (index !== -1) {
                const newGroups = [...state.widgetGroups];
                newGroups[index] = { ...newGroups[index], ...updates };
                return {
                  ...state,
                  widgetGroups: newGroups,
                  lastSyncTime: Date.now()
                };
              }
              return state;
            }
          );
        },

        // Delete a widget group
        deleteWidgetGroup: (groupId: string) => {
          set(
            (state) => ({
              ...state,
              widgetGroups: state.widgetGroups.filter(g => g.id !== groupId),
              lastSyncTime: Date.now()
            })
          );
        },

        // Set active dashboard
        setActiveDashboard: (dashboardId: string | null) => {
          set({ activeDashboard: dashboardId });
        },

        // Sync widget state with OBS - enhanced implementation
        syncWidgetState: async (widgetId: string) => {
          set({ isLoading: true, error: null });
          
          try {
            // Prefer authoritative state from the engine if available
            const engineContext = widgetEngine.getWidgetContext(widgetId);
            if (!engineContext) {
              // Fall back to local store context for better error message
              const localContext = get().widgets.get(widgetId);
              if (!localContext) {
                throw new Error(`Widget not found: ${widgetId}`);
              }
              throw new Error(`Widget not registered in engine: ${widgetId}`);
            }
            
            const updatedState = engineContext.state;
            
            set(
              (state) => {
                const newWidgets = new Map(state.widgets);
                const existingContext = state.widgets.get(widgetId) || engineContext;
                const updatedContext: WidgetContext = {
                  ...existingContext,
                  state: { ...existingContext.state, ...updatedState }
                };
                newWidgets.set(widgetId, updatedContext);
                
                return {
                  ...state,
                  widgets: newWidgets,
                  isLoading: false,
                  lastSyncTime: Date.now(),
                  error: null
                };
              }
            );
            
            console.log(`[WidgetStore] Widget synced successfully: ${widgetId}`);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to sync widget';
            const widgetError = new WidgetError(errorMessage, 'SYNC_FAILED');
            set({
              error: widgetError,
              isLoading: false
            });
            console.error(`[WidgetStore] Failed to sync widget: ${widgetId}`, error);
            
            // Auto-retry mechanism for transient errors
            if (widgetError.code !== 'PERMANENT_FAILURE') {
              setTimeout(() => {
                get().syncWidgetState(widgetId).catch(() => {
                  // Silent retry failure
                });
              }, 2000);
            }
            
            throw widgetError;
          }
        },

        // Sync all widgets - enhanced implementation with batch processing
        syncAllWidgets: async () => {
          set({ isLoading: true, error: null });
          
          try {
            const widgetIds = Array.from(get().widgets.keys());
            console.log(`[WidgetStore] Sync requested for ${widgetIds.length} widgets`);
            
            // Batch process widgets to avoid overwhelming OBS
            const BATCH_SIZE = 5;
            const batches = [];
            
            for (let i = 0; i < widgetIds.length; i += BATCH_SIZE) {
              batches.push(widgetIds.slice(i, i + BATCH_SIZE));
            }
            
            // Process batches sequentially
            for (const batch of batches) {
              await Promise.allSettled(
                batch.map(widgetId => get().syncWidgetState(widgetId))
              );
              
              // Small delay between batches to prevent OBS overload
              await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            set({
              isLoading: false,
              lastSyncTime: Date.now(),
              error: null
            });
            
            console.log('[WidgetStore] All widgets synced successfully');
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to sync widgets';
            const widgetError = new WidgetError(errorMessage, 'SYNC_FAILED');
            set({
              error: widgetError,
              isLoading: false
            });
            console.error('[WidgetStore] Failed to sync all widgets', error);
          }
        },

        // Clear error
        clearError: () => {
          set({ error: null });
        },

        // Add action to cache
        addToCache: (widgetId: string, action: ActionConfig, success: boolean) => {
          set((state) => {
            const existing = state.recentActions[widgetId] || [];
            const history = [...existing, { action, timestamp: Date.now(), success }].slice(-10); // Keep last 10
            return {
              ...state,
              recentActions: { ...state.recentActions, [widgetId]: history }
            };
          });
        },

        // Get cached actions for a widget
        getCachedActions: (widgetId: string) => get().recentActions[widgetId] || [],

        // Getters
        getWidget: (widgetId: string) => {
          return get().widgets.get(widgetId);
        },

        getWidgetConfig: (widgetId: string) => {
          return get().widgetConfigs.get(widgetId);
        },

        getWidgetsByType: (widgetType: string) => {
          return Array.from(get().widgets.values()).filter(
            widget => widget.config.type === widgetType
          );
        },

        getWidgetsByGroup: (groupId: string) => {
          const group = get().widgetGroups.find(g => g.id === groupId);
          if (!group) return [];
          
          return group.widgetIds
            .map(widgetId => get().widgets.get(widgetId))
            .filter(Boolean) as WidgetContext[];
        },

        getActiveWidgets: () => {
          return Array.from(get().widgets.values()).filter(
            widget => widget.state.enabled
          );
        },

        getWidgetMetrics: (widgetId: string) => {
          return widgetEngine.getMetrics(widgetId);
        },

        // Additional utility methods
        exportWidgetConfigs: () => {
          const state = get();
          return Array.from(state.widgetConfigs.entries()).map(([id, config]) => ({
            // Prefer the config's fields; avoid duplicating `id` key when spreading
            ...config,
            groupId: state.widgetGroups.find(g => g.widgetIds.includes(id))?.id || null
          }));
        },

        importWidgetConfigs: (configs: any[]) => {
          set({ isLoading: true, error: null });
          
          try {
            configs.forEach(config => {
              const { id, groupId, ...widgetConfig } = config;
              get().widgetConfigs.set(id, widgetConfig as UniversalWidgetConfig);
              
              if (groupId) {
                const groupIndex = get().widgetGroups.findIndex(g => g.id === groupId);
                if (groupIndex !== -1 && !get().widgetGroups[groupIndex].widgetIds.includes(id)) {
                  get().widgetGroups[groupIndex].widgetIds.push(id);
                }
              }
            });
            
            set({
              isLoading: false,
              lastSyncTime: Date.now(),
              error: null
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to import widgets';
            const widgetError = new WidgetError(errorMessage, 'IMPORT_FAILED');
            set({
              error: widgetError,
              isLoading: false
            });
            throw widgetError;
          }
        },

        // Reset store to initial state
        resetStore: () => {
          set({
            widgets: new Map(),
            widgetConfigs: new Map(),
            selectedWidgetId: null,
            widgetGroups: [],
            activeDashboard: null,
            isLoading: false,
            error: null,
            lastSyncTime: null
          });
        }
      })
    ),
    {
      name: 'widget-store',
      partialize: (state: WidgetStoreState) => ({
        widgetConfigs: Array.from(state.widgetConfigs.entries()),
        widgetGroups: state.widgetGroups,
        activeDashboard: state.activeDashboard,
        selectedWidgetId: state.selectedWidgetId,
        lastSyncTime: state.lastSyncTime
      }),
      serialize: {
        options: {
          map: true
        }
      }
    }
  )
);

// Subscribe to widget engine events
widgetEngine.on('widgetStateUpdated', ({ widgetId, state }) => {
  useWidgetStore.getState().updateWidgetState(widgetId, state);
});

widgetEngine.on('actionExecuted', ({ widgetId, result }) => {
  console.log(`[WidgetStore] Action executed for widget: ${widgetId}`, result);
});

widgetEngine.on('actionError', ({ widgetId, error }) => {
  console.error(`[WidgetStore] Action error for widget: ${widgetId}`, error);
  useWidgetStore.getState().error = error;
});

widgetEngine.on('obsEventProcessed', ({ eventType, widgetCount }) => {
  console.log(`[WidgetStore] OBS event processed: ${eventType} for ${widgetCount} widgets`);
});

// Helper hooks for common operations
export const useWidget = (widgetId: string) => {
  return useWidgetStore(
    (state) => ({
      widget: state.widgets.get(widgetId),
      config: state.widgetConfigs.get(widgetId),
      updateState: state.updateWidgetState,
      syncState: state.syncWidgetState
    })
  );
};

export const useWidgetGroup = (groupId: string) => {
  return useWidgetStore(
    (state) => ({
      group: state.widgetGroups.find(g => g.id === groupId),
      widgets: state.getWidgetsByGroup(groupId),
      updateGroup: state.updateWidgetGroup,
      deleteGroup: state.deleteWidgetGroup
    })
  );
};

export const useWidgetSelection = () => {
  return useWidgetStore(
    (state) => ({
      selectedWidgetId: state.selectedWidgetId,
      selectWidget: state.selectWidget,
      selectedWidget: state.selectedWidgetId ? state.widgets.get(state.selectedWidgetId) : null
    })
  );
};

export const useWidgetMetrics = (widgetId: string) => {
  return useWidgetStore(
    (state) => ({
      metrics: state.getWidgetMetrics(widgetId)
    })
  );
};

// Export the store and types
export default useWidgetStore;