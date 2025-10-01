import React, { useState, useEffect } from 'react';
// react-grid-layout provides a default export (GridLayout) and named WidthProvider.
// Some bundlers can mis-handle a renamed default import; use semantic name for clarity.
import GridLayout, { WidthProvider, type Layout } from 'react-grid-layout';
import ObsWidget from './ObsWidget';
import ObsWidgetConfigModal from './ObsWidgetConfigModal';
import { ObsWidgetConfig } from '@/types/obs';
import useConnectionsStore from '@/store/connectionsStore';
import { useWidgetsStore } from '@/store/widgetsStore';

const ReactGridLayout = WidthProvider(GridLayout as any);

const NewObsStudioTab: React.FC = () => {
  const { scenes, sources } = useConnectionsStore();
  const widgetsMap = useWidgetsStore((s) => s.widgets);
  const addWidget = useWidgetsStore((s) => s.addWidget);
  const removeWidget = useWidgetsStore((s) => s.removeWidget);

  // Convert widgets map to array for rendering. The widgets store uses UniversalWidgetConfig,
  // so map to the OBS widget shape where possible (best-effort).
  const widgets = Object.values(widgetsMap).map((w) => {
    const cfg = w.config as any;
    const obsLike: ObsWidgetConfig = {
      id: cfg.id || cfg.widgetId || String(Math.random()),
      label: cfg.label || cfg.name || cfg.title || 'Widget',
      type: (cfg.type as any) || 'control',
      sceneName: cfg.sceneName || cfg.scene || undefined,
      sourceName: cfg.sourceName || cfg.source || undefined,
      control: cfg.control || undefined,
    } as ObsWidgetConfig;
    return obsLike;
  });
  const [layout, setLayout] = useState<Layout[]>([]);

  const handleAddWidget = (config: ObsWidgetConfig) => {
    // Store as a minimal UniversalWidgetConfig-compatible object
    const toStore = {
      id: config.id,
      label: config.label,
      type: config.type,
      sceneName: config.sceneName,
      sourceName: config.sourceName,
    } as any;
    addWidget(toStore);
    setLayout((prev: Layout[]) => [
      ...prev,
      {
        i: config.id,
        x: (Object.keys(widgetsMap).length * 2) % 12,
        y: Infinity as any,
        w: 2,
        h: 2,
      } as unknown as Layout,
    ]);
  };

  useEffect(() => {
    // Initialize layout from stored widgets if layout empty
    if (layout.length === 0 && widgets.length > 0) {
      const inferred: Layout[] = widgets.map((w, idx) => ({ i: w.id, x: (idx * 2) % 12, y: Math.floor(idx / 6) * 2, w: 2, h: 2 } as unknown as Layout));
      setLayout(inferred);
    }
  }, [widgets]);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">OBS Control</h2>
        <ObsWidgetConfigModal
          onSave={handleAddWidget}
          scenes={scenes.map((s) => s.sceneName)}
          sources={sources.map((s) => s.sourceName)}
        />
      </div>
      <ReactGridLayout
        className="layout"
        layout={layout}
        cols={12}
        rowHeight={30}
  onLayoutChange={(newLayout: Layout[]) => setLayout(newLayout)}
      >
        {widgets.map((widget) => (
          <div key={widget.id}>
            <ObsWidget {...widget} />
          </div>
        ))}
      </ReactGridLayout>
    </div>
  );
};

export default NewObsStudioTab;
