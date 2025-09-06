import { create } from 'zustand';

interface Widget {
  id: string;
  type: string;
  config: any;
  state: any;
}

interface WidgetsStore {
  widgets: Widget[];
  addWidget: (widget: Widget) => void;
  removeWidget: (id: string) => void;
  updateWidget: (id: string, updates: Partial<Widget>) => void;
  setWidgetState: (id: string, state: any) => void;
  getWidget: (id: string) => Widget | undefined;
}

export const useWidgetsStore = create<WidgetsStore>((set, get) => ({
  widgets: [],
  addWidget: (widget) => set((state) => ({ widgets: [...state.widgets, widget] })),
  removeWidget: (id) => set((state) => ({ widgets: state.widgets.filter(w => w.id !== id) })),
  updateWidget: (id, updates) => set((state) => ({
    widgets: state.widgets.map(w => w.id === id ? { ...w, ...updates } : w)
  })),
  setWidgetState: (id, state) => set((state) => ({
    widgets: state.widgets.map(w => w.id === id ? { ...w, state } : w)
  })),
  getWidget: (id) => get().widgets.find(w => w.id === id),
}));