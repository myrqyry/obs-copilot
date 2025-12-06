import { create } from 'zustand';
import { persist, PersistStorage } from 'zustand/middleware';
import { Layout } from 'react-grid-layout';
import { saveDashboard, loadDashboard } from '@/shared/services/persistenceService';
import { UniversalWidgetConfig, WidgetState } from '@/shared/types/universalWidget';

export interface WidgetContext {
  config: UniversalWidgetConfig;
  state: WidgetState;
}

export interface WidgetGroup {
  id: string;
  name: string;
  widgetIds: string[];
}

export interface WidgetStoreState {
  widgets: Map<string, WidgetContext>;
  widgetGroups: WidgetGroup[];
  layouts: { [key: string]: Layout[] };
  selectedWidgetId: string | null;
  registerWidget: (config: UniversalWidgetConfig) => void;
  selectWidget: (widgetId: string | null) => void;
  updateWidgetConfig: (widgetId: string, config: Partial<UniversalWidgetConfig>) => void;
  createWidgetGroup: (group: WidgetGroup) => void;
  updateWidgetGroup: (groupId: string, updates: Partial<WidgetGroup>) => void;
  setLayouts: (layouts: { [key: string]: Layout[] }) => void;
}

const storage: PersistStorage<WidgetStoreState> = {
  getItem: (name) => {
    const state = loadDashboard();
    return {
      state: { ...state, ...useWidgetStore.getState() }
    };
  },
  setItem: (name, value) => {
    saveDashboard(value.state);
  },
  removeItem: (name) => {
    localStorage.removeItem('dashboardState');
  }
};

export const useWidgetStore = create<WidgetStoreState>(
  persist(
    (set) => ({
      widgets: new Map(),
      widgetGroups: [{ id: 'default', name: 'Default', widgetIds: [] }],
      layouts: { lg: [], md: [], sm: [], xs: [], xxs: [] },
      selectedWidgetId: null,
      registerWidget: (config) =>
        set((state) => {
          const newWidgets = new Map(state.widgets);
          const newGroups = state.widgetGroups.map((g) => {
            if (g.id === 'default') {
              return { ...g, widgetIds: [...g.widgetIds, config.id] };
            }
            return g;
          });
          newWidgets.set(config.id, { config, state: config.state });
          return { widgets: newWidgets, widgetGroups: newGroups };
        }),
      selectWidget: (widgetId) => set({ selectedWidgetId: widgetId }),
      updateWidgetConfig: (widgetId, configUpdate) =>
        set((state) => {
          const widget = state.widgets.get(widgetId);
          if (widget) {
            const newWidgets = new Map(state.widgets);
            const updatedConfig = { ...widget.config, ...configUpdate };
            newWidgets.set(widgetId, { ...widget, config: updatedConfig });
            return { widgets: newWidgets };
          }
          return state;
        }),
      createWidgetGroup: (group) =>
        set((state) => ({ widgetGroups: [...state.widgetGroups, group] })),
      updateWidgetGroup: (groupId, updates) =>
        set((state) => ({
          widgetGroups: state.widgetGroups.map((group) =>
            group.id === groupId ? { ...group, ...updates } : group
          ),
        })),
      setLayouts: (layouts) => set({ layouts }),
    }),
    {
      name: 'dashboardState',
      storage,
    }
  )
);

// Helper hooks for convenience
export const useWidget = (widgetId: string | null) => {
  return useWidgetStore((state) => {
    if (!widgetId) return { widget: null, config: null, updateConfig: () => {} };
    const widget = state.widgets.get(widgetId);
    return {
      widget,
      config: widget?.config,
      updateConfig: (configUpdate: Partial<UniversalWidgetConfig>) => state.updateWidgetConfig(widgetId, configUpdate),
    };
  });
};

export const useWidgetSelection = () => {
  return useWidgetStore((state) => ({
    selectedWidgetId: state.selectedWidgetId,
    selectWidget: state.selectWidget,
    selectedWidget: state.selectedWidgetId ? state.widgets.get(state.selectedWidgetId) : null,
  }));
};

export default useWidgetStore;