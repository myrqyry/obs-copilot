import React from 'react';
import { Button } from '@/components/ui/Button';
import { obsClient } from '@/services/obsClient';
import { UniversalWidgetConfig } from '@/types/universalWidget';
import { useWidgetStore } from './widgetStore';

interface ButtonWidgetProps {
  config: UniversalWidgetConfig;
}

export const ButtonWidget: React.FC<ButtonWidgetProps> = ({ config }) => {
  const { id, actionType, targetName } = config;
  const { updateWidgetState } = useWidgetStore();
  const [isLoading, setIsLoading] = React.useState(false);

  const executeAction = async () => {
    if (!obsClient || isLoading) return;
    setIsLoading(true);
    try {
      let result;
      const action = actionType as string; // Allow flexible action types
      switch (action) {
        case 'StartStream':
          result = await obsClient.call('StartStream');
          updateWidgetState(id, { value: 'streaming', metadata: { status: 'streaming' } });
          break;
        case 'StopStream':
          result = await obsClient.call('StopStream');
          updateWidgetState(id, { value: 'stopped', metadata: { status: 'stopped' } });
          break;
        case 'StartRecord':
          result = await obsClient.call('StartRecord');
          updateWidgetState(id, { value: 'recording', metadata: { status: 'recording' } });
          break;
        case 'StopRecord':
          result = await obsClient.call('StopRecord');
          updateWidgetState(id, { value: 'stopped', metadata: { status: 'stopped' } });
          break;
        case 'ToggleMute':
          if (targetName) {
            const { inputMuted } = await obsClient.call('GetInputMute', { inputName: targetName });
            result = await obsClient.call('SetInputMute', { inputName: targetName, inputMuted: !inputMuted });
            updateWidgetState(id, { value: !inputMuted, metadata: { muted: !inputMuted } });
          }
          break;
        case 'SwitchScene':
          if (targetName) {
            result = await obsClient.call('SetCurrentProgramScene', { sceneName: targetName });
            updateWidgetState(id, { value: targetName, metadata: { currentScene: targetName } });
          }
          break;
        default:
          console.warn(`Unsupported action: ${actionType}`);
          return;
      }
      console.log(`Action ${actionType} executed:`, result);
    } catch (error) {
      console.error(`Error executing action ${actionType}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="widget-container">
      <Button
        onClick={executeAction}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? 'Loading...' : (actionType || 'Execute')}
      </Button>
    </div>
  );
};