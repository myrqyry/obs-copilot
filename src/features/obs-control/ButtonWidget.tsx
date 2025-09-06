import React from 'react';
import { BaseWidget } from './BaseWidget';
import { Button } from '@/components/ui/button';
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
      switch (actionType) {
        case 'StartStream':
          result = await obsClient.call('StartStream');
          updateWidgetState(id, { status: 'streaming' });
          break;
        case 'StopStream':
          result = await obsClient.call('StopStream');
          updateWidgetState(id, { status: 'stopped' });
          break;
        case 'StartRecord':
          result = await obsClient.call('StartRecord');
          updateWidgetState(id, { status: 'recording' });
          break;
        case 'StopRecord':
          result = await obsClient.call('StopRecord');
          updateWidgetState(id, { status: 'stopped' });
          break;
        case 'ToggleMute':
          if (targetName) {
            const { inputMuted } = await obsClient.call('GetInputMute', { inputName: targetName });
            result = await obsClient.call('SetInputMute', { inputName: targetName, inputMuted: !inputMuted });
            updateWidgetState(id, { muted: !inputMuted });
          }
          break;
        case 'SwitchScene':
          if (targetName) {
            result = await obsClient.call('SetCurrentProgramScene', { sceneName: targetName });
            updateWidgetState(id, { currentScene: targetName });
          }
          break;
        default:
          console.warn(`Unsupported action: ${actionType}`);
          return;
      }
      console.log(`Action ${actionType} executed:`, result);
    } catch (error) {
      console.error(`Failed to execute ${actionType}:`, error);
      updateWidgetState(id, { error: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  const buttonLabel = config.name || actionType;
  const buttonVariant = actionType.includes('Stop') ? 'destructive' : 'default';

  return (
    <BaseWidget config={config}>
      <Button
        onClick={executeAction}
        disabled={isLoading || !obsClient}
        variant={buttonVariant}
        className="w-full"
        size="lg"
      >
        {isLoading ? 'Loading...' : buttonLabel}
      </Button>
    </BaseWidget>
  );
};