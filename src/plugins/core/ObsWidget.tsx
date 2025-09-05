import React from 'react';
import { ObsWidgetConfig } from '@/types/obs';
import useConnectionsStore from '@/store/connectionsStore';
import { Button } from '@/components/ui/button';
import SliderWidget from '@/features/obs-control/SliderWidget';
import KnobWidget from '@/features/obs-control/KnobWidget';

const ObsWidget: React.FC<ObsWidgetConfig> = (config) => {
  const { type, label, sceneName, sourceName } = config;
  const { obs: client } = useConnectionsStore();

  if (config.control) {
    switch (config.control.kind) {
      case 'slider':
        return <SliderWidget config={config} />;
      case 'knob':
        return <KnobWidget config={config} />;
      default:
        return <div className="text-red-500">Unsupported control type: {config.control.kind}</div>;
    }
  }

  const handleClick = async () => {
    if (!client) return;

    switch (type) {
      case 'toggle_mute':
        if (sourceName) {
          const { inputMuted } = await client.call('GetInputMute', { inputName: sourceName });
          await client.call('SetInputMute', { inputName: sourceName, inputMuted: !inputMuted });
        }
        break;
      case 'switch_scene':
        if (sceneName) {
          await client.call('SetCurrentProgramScene', { sceneName });
        }
        break;
      default:
        break;
    }
  };

  return (
    <Button onClick={handleClick} className="w-full h-full">
      {label}
    </Button>
  );
};

export default ObsWidget;
