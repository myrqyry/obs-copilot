import React, { useState, useEffect } from 'react';
import RGL, { WidthProvider } from 'react-grid-layout';
import ObsWidget from './ObsWidget';
import ObsWidgetConfigModal from './ObsWidgetConfigModal';
import { ObsWidgetConfig } from '@/types/obs';
import useObsStore from '@/store/obsStore';

const ReactGridLayout = WidthProvider(RGL);

const NewObsStudioTab: React.FC = () => {
  const [widgets, setWidgets] = useState<ObsWidgetConfig[]>([]);
  const [layout, setLayout] = useState<RGL.Layout[]>([]);
  const { scenes, sources, getScenes, getSources } = useObsStore();

  useEffect(() => {
    getScenes();
    getSources();
  }, [getScenes, getSources]);

  const handleAddWidget = (config: ObsWidgetConfig) => {
    setWidgets([...widgets, config]);
    setLayout([
      ...layout,
      {
        i: config.id,
        x: (widgets.length * 2) % 12,
        y: Infinity, // puts it at the bottom
        w: 2,
        h: 2,
      },
    ]);
  };

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
        onLayoutChange={(newLayout) => setLayout(newLayout)}
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
