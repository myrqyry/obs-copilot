import { WidgetStoreState } from '@/features/obs-control/widgetStore';

// Define a serializable version of the state
interface SerializableState {
  widgets: [string, any][];
  widgetGroups: any[];
  layouts: any;
}

/**
 * Saves the dashboard state to local storage.
 * It serializes the state, converting Map to Array.
 */
export const saveDashboard = (state: WidgetStoreState) => {
  const serializableState: SerializableState = {
    widgets: Array.from(state.widgets.entries()),
    widgetGroups: state.widgetGroups,
    layouts: state.layouts,
  };
  localStorage.setItem('dashboardState', JSON.stringify(serializableState));
};

/**
 * Loads the dashboard state from local storage.
 * It deserializes the state, converting Array back to Map.
 */
export const loadDashboard = (): Partial<WidgetStoreState> => {
  const savedState = localStorage.getItem('dashboardState');
  if (savedState) {
    const serializableState: SerializableState = JSON.parse(savedState);
    return {
      widgets: new Map(serializableState.widgets),
      widgetGroups: serializableState.widgetGroups,
      layouts: serializableState.layouts,
    };
  }
  return {};
};