import React, { useState, useEffect } from 'react';
import { useUniversalWidgetStore } from '@/store/widgetsStore';
import { obsClient } from '@/services/obsClient';
import type { UniversalWidgetConfig } from '@/types/universalWidget';

interface SceneSwitcherWidgetProps extends UniversalWidgetConfig {
  config: { showItems?: boolean };
  id: string;
  className?: string;
}

const SceneSwitcherWidget: React.FC<SceneSwitcherWidgetProps> = ({ config, id }) => {
  const { updateWidgetState } = useUniversalWidgetStore();
  const [scenes, setScenes] = useState<any[]>([]);
  const [currentScene, setCurrentScene] = useState<string>('');
  const [sceneItems, setSceneItems] = useState<any[]>([]);

  useEffect(() => {
    fetchScenes();
  }, []);

  const fetchScenes = async () => {
    try {
      const response = await obsClient.call('GetSceneList');
      setScenes(response.scenes || []);
      if (response.currentProgramSceneName) {
        setCurrentScene(response.currentProgramSceneName);
        fetchSceneItems(response.currentProgramSceneName);
      }
    } catch (error) {
      console.error('Failed to fetch scenes:', error);
      updateWidgetState(id, { error: 'Failed to fetch scenes' });
    }
  };

  const fetchSceneItems = async (sceneName: string) => {
    try {
      const response = await obsClient.call('GetSceneItemList', { sceneName });
      setSceneItems(response.sceneItems || []);
    } catch (error) {
      console.error('Failed to fetch scene items:', error);
      setSceneItems([]);
    }
  };

  const switchScene = async (sceneName: string) => {
    try {
      await obsClient.call('SetCurrentProgramScene', { sceneName });
      setCurrentScene(sceneName);
      fetchSceneItems(sceneName);
      updateWidgetState(id, { value: sceneName });
    } catch (error) {
      console.error('Failed to switch scene:', error);
      updateWidgetState(id, { error: 'Failed to switch scene' });
    }
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg shadow-lg max-w-sm mx-auto">
      <h3 className="text-foreground text-lg font-bold mb-2">Scene Switcher</h3>
      <div className="space-y-2 mb-4">
        {scenes.map((scene) => (
          <button
            key={scene.sceneName}
            onClick={() => switchScene(scene.sceneName)}
            className={`w-full p-2 rounded transition-colors ${currentScene === scene.sceneName ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-foreground'}`}
          >
            {scene.sceneName}
          </button>
        ))}
      </div>
      {currentScene && (
        <div>
          <h4 className="text-white mb-2">Current Scene: {currentScene}</h4>
          {config.showItems && (
            <div className="text-gray-300 text-sm space-y-1 max-h-40 overflow-y-auto">
              <strong>Items:</strong>
              {sceneItems.length > 0 ? (
                sceneItems.map((item, index) => (
                  <div key={index} className="p-1 bg-gray-700 rounded">
                    {item.sourceName}
                  </div>
                ))
              ) : (
                <div className="p-1 bg-gray-700 rounded">No items in scene</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SceneSwitcherWidget;