import React from 'react';
import { useWidgetsStore } from '@/store/widgetsStore';
import { AudioVolumeWidget } from './AudioVolumeWidget';
import { AudioMeterWidget } from './AudioMeterWidget';
import { AudioMixerWidget } from './AudioMixerWidget';
import { AudioFilterWidget } from './AudioFilterWidget';
import { SceneSwitcherWidget } from './SceneSwitcherWidget';
import { SceneCreatorWidget } from './SceneCreatorWidget';
import { SceneOrganizerWidget } from './SceneOrganizerWidget';
import { TransitionWidget } from './TransitionWidget';
import { TransformWidget } from './TransformWidget';
import { VisibilityWidget } from './VisibilityWidget';
import { FilterManagerWidget } from './FilterManagerWidget';
import { SourceSettingsWidget } from './SourceSettingsWidget';
import type { UniversalWidgetConfig } from '@/types/universalWidget';

interface UniversalWidgetEngineProps {
  widgets: UniversalWidgetConfig[];
  onWidgetUpdate: (id: string, config: UniversalWidgetConfig) => void;
  id: string;
}

const widgetComponents = {
  audioVolume: AudioVolumeWidget,
  audioMeter: AudioMeterWidget,
  audioMixer: AudioMixerWidget,
  audioFilter: AudioFilterWidget,
  sceneSwitcher: SceneSwitcherWidget,
  sceneCreator: SceneCreatorWidget,
  sceneOrganizer: SceneOrganizerWidget,
  transition: TransitionWidget,
  transform: TransformWidget,
  visibility: VisibilityWidget,
  filterManager: FilterManagerWidget,
  sourceSettings: SourceSettingsWidget,
};

const UniversalWidgetEngine: React.FC<UniversalWidgetEngineProps> = ({ widgets, onWidgetUpdate, id }) => {
  const { updateWidgetState } = useWidgetsStore();

  const handleWidgetUpdate = (widgetId: string, updates: Partial<UniversalWidgetConfig>) => {
    onWidgetUpdate(widgetId, { ...widgets.find(w => w.id === widgetId), ...updates });
  };

  const renderWidget = (widget: UniversalWidgetConfig) => {
    const Component = widgetComponents[widget.type as keyof typeof widgetComponents];
    if (!Component) {
      console.warn(`Unknown widget type: ${widget.type}`);
      return <div className="p-4 bg-red-800 text-white rounded">Unknown Widget: {widget.type}</div>;
    }

    return (
      <div key={widget.id} className="mb-4 p-2 border border-gray-700 rounded">
        <Component {...widget} onUpdate={handleWidgetUpdate} />
      </div>
    );
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-white text-xl font-bold mb-4">Universal Widget Engine</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {widgets.map(renderWidget)}
      </div>
    </div>
  );
};

export default UniversalWidgetEngine;