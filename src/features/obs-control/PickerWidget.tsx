import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { BaseWidget } from './BaseWidget';
import { UniversalWidgetConfig } from '@/shared/types/universalWidget';
import useConnectionsStore from '@/app/store/connections';
import { logger } from '@/shared/utils/logger';

interface PickerWidgetProps {
  config: UniversalWidgetConfig;
}

const PickerWidget: React.FC<PickerWidgetProps> = ({ config }) => {
  const { obs: obsClient, isConnected: isObsConnected } = useConnectionsStore();
  const [selectedScene, setSelectedScene] = useState('');
  const [scenes, setScenes] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch scenes from OBS on mount
  useEffect(() => {
    const fetchScenes = async () => {
      if (!isObsConnected || !obsClient) {
        setErrorMessage('OBS not connected');
        return;
      }

      try {
        // OBS WebSocket call to get scene list
        const response = await obsClient.call('GetSceneList');
        const sceneNames = response.scenes ? response.scenes.map((s: any) => s.sceneName) : [];
        setScenes(sceneNames);
        if (sceneNames.length > 0) {
          setSelectedScene(sceneNames[0]);
        }
      } catch (error: any) {
        logger.error(`Failed to fetch scenes: ${error.message}`);
        setErrorMessage('Failed to fetch scenes');
      }
    };

    fetchScenes();
  }, [isObsConnected, obsClient]);

  const handleSceneChange = async (value: string) => {
    setSelectedScene(value);
    if (!isObsConnected || !obsClient) {
      setErrorMessage('OBS not connected');
      return;
    }

    try {
      // Switch to the selected scene
      await obsClient.call('SetCurrentScene', { sceneName: value });
      logger.info(`Switched to scene: ${value}`);
    } catch (error: any) {
      logger.error(`Failed to switch to scene ${value}: ${error.message}`);
      setErrorMessage('Failed to switch scene');
    }
  };

  if (!isObsConnected) {
    return (
      <BaseWidget config={config}>
        <div className="flex flex-col gap-2 p-2 rounded-md border opacity-50">
          <label className="text-sm font-medium">Select Scene</label>
          <div className="text-muted-foreground">Not connected to OBS</div>
        </div>
      </BaseWidget>
    );
  }

  return (
    <BaseWidget config={config}>
      <div className="flex flex-col gap-2 p-2 rounded-md border">
        <label className="text-sm font-medium">Select Scene</label>
        <Select value={selectedScene} onValueChange={handleSceneChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a scene" />
          </SelectTrigger>
              <SelectContent>
                {scenes
                  .filter((s) => s != null && s !== '')
                  .map((scene) => (
                    <SelectItem key={scene} value={scene}>
                      {scene}
                    </SelectItem>
                  ))}
              </SelectContent>
        </Select>
        {errorMessage && <p className="text-error text-xs mt-1">{errorMessage}</p>}
      </div>
    </BaseWidget>
  );
};

export default PickerWidget;