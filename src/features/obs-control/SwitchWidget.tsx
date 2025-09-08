import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { obsClient } from '@/services/obsClient';
import { UniversalWidgetConfig } from '@/types/universalWidget';
import { useWidgetStore } from './widgetStore';

interface SwitchWidgetProps {
  config: UniversalWidgetConfig;
}

export const SwitchWidget: React.FC<SwitchWidgetProps> = ({ config }) => {
  const { id, actionType, targetName } = config;
  const { updateWidgetState } = useWidgetStore();
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentValue, setCurrentValue] = useState<boolean | null>(null);

  // Fetch initial state on mount
  React.useEffect(() => {
    const fetchInitialState = async () => {
      if (!obsClient || !targetName) return;
      try {
        const action = actionType as string; // Allow flexible action types
        switch (action) {
          case 'ToggleMute':
            const { inputMuted } = await obsClient.call('GetInputMute', { inputName: targetName });
            setIsChecked(inputMuted);
            setCurrentValue(inputMuted);
            updateWidgetState(id, { value: inputMuted, metadata: { muted: inputMuted } });
            break;
          // Add other boolean actions like scene item enabled
          case 'ToggleSourceEnabled':
            const sceneName = config.targetName; // Use targetName for scene
            if (sceneName) {
              const sceneItems = await obsClient.call('GetSceneItemList', { sceneName });
              const item = sceneItems.sceneItems.find((item: any) => item.sourceName === targetName);
              if (item) {
                setIsChecked(item.sceneItemEnabled);
                setCurrentValue(item.sceneItemEnabled);
                updateWidgetState(id, { value: item.sceneItemEnabled, metadata: { enabled: item.sceneItemEnabled } });
              }
            }
            break;
          default:
            break;
        }
      } catch (error) {
        console.error(`Failed to fetch initial state for ${actionType}:`, error);
        updateWidgetState(id, { error: (error as Error).message });
      }
    };
    fetchInitialState();
  }, [actionType, targetName, id, updateWidgetState]);

  const toggleSwitch = async () => {
    if (!obsClient || isLoading || !targetName) return;
    setIsLoading(true);
    const newValue = !currentValue;
    try {
      let result;
      const action = actionType as string; // Allow flexible action types
      switch (action) {
        case 'ToggleMute':
          result = await obsClient.call('SetInputMute', { inputName: targetName, inputMuted: newValue });
          updateWidgetState(id, { value: newValue, metadata: { muted: newValue } });
          break;
        case 'ToggleSourceEnabled':
          const sceneName = config.targetName; // Use targetName for scene
          if (sceneName) {
            result = await obsClient.call('SetSceneItemEnabled', { sceneName, sceneItemId: 0, sceneItemEnabled: newValue }); // Assume ID 0 or fetch properly
            updateWidgetState(id, { value: newValue, metadata: { enabled: newValue } });
          }
          break;
        default:
          console.warn(`Unsupported action for switch: ${actionType}`);
          return;
      }
      setIsChecked(newValue);
      setCurrentValue(newValue);
      console.log(`Action ${actionType} executed:`, result);
    } catch (error) {
      console.error(`Failed to execute ${actionType}:`, error);
      updateWidgetState(id, { error: (error as Error).message });
      setIsChecked(currentValue || false); // Revert on error
    } finally {
      setIsLoading(false);
    }
  };

  const switchLabel = config.name || `${actionType} Toggle`;
  const disabled = isLoading || !obsClient;

  return (
    <div className="widget-container">
      <div className="flex items-center justify-between p-2">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {switchLabel}
        </label>
        <Switch
          checked={isChecked}
          onCheckedChange={toggleSwitch}
          disabled={disabled}
        />
      </div>
    </div>
  );
};