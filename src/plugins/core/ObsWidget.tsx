import React from 'react';
import { ObsWidgetConfig } from '@/types/obs';
import useConnectionsStore from '@/store/connectionsStore';
import { Button } from '@/components/ui/button';

const ObsWidget: React.FC<ObsWidgetConfig> = ({ type, label, sceneName, sourceName }) => {
  const { obs: client } = useConnectionsStore();

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
