import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useUniversalWidgetStore } from '@/app/store/widgetsStore';
import { obsClient } from '@/shared/services/obsClient';
import type { UniversalWidgetConfig } from '@/shared/types/universalWidget';
import { FixedSizeList as List } from 'react-window';
import type { OBSScene } from '@/shared/types/obs';

interface SceneSwitcherWidgetProps extends UniversalWidgetConfig {
  config: { showItems?: boolean };
  id: string;
  className?: string;
}

const SceneSwitcherWidget: React.FC<SceneSwitcherWidgetProps> = React.memo(({ config, id }) => {
  const { updateWidgetState } = useUniversalWidgetStore();
  const [scenes, setScenes] = useState<OBSScene[]>([]);
  const [currentScene, setCurrentScene] = useState<string>('');
  const [sceneItems, setSceneItems] = useState<any[]>([]);

  const fetchScenes = useCallback(async () => {
    try {
      const response = await obsClient.call<{ scenes: OBSScene[], currentProgramSceneName: string }>('GetSceneList');
      setScenes(response.scenes || []);
      if (response.currentProgramSceneName) {
        setCurrentScene(response.currentProgramSceneName);
        fetchSceneItems(response.currentProgramSceneName);
      }
    } catch (error) {
      console.error('Failed to fetch scenes:', error);
      updateWidgetState(id, { error: 'Failed to fetch scenes' });
    }
  }, [id, updateWidgetState]);

  useEffect(() => {
    fetchScenes();

    const unsubscribeSceneChange = obsClient.on('CurrentProgramSceneChanged', ({ sceneName }) => {
      setCurrentScene(sceneName);
      fetchSceneItems(sceneName);
    });

    const unsubscribeSceneListChange = obsClient.on('SceneListChanged', ({ scenes }) => {
      setScenes(scenes);
    });

    return () => {
      unsubscribeSceneChange();
      unsubscribeSceneListChange();
    };
  }, [fetchScenes]);

  const fetchSceneItems = useCallback(async (sceneName: string) => {
    try {
      const response = await obsClient.call<{ sceneItems: any[] }>('GetSceneItemList', { sceneName });
      setSceneItems(response.sceneItems || []);
    } catch (error) {
      console.error('Failed to fetch scene items:', error);
      setSceneItems([]);
    }
  }, []);

  const switchScene = useCallback(async (sceneName: string) => {
    try {
      await obsClient.call('SetCurrentProgramScene', { sceneName });
      // The event listener will update the current scene, no need to set it here
      updateWidgetState(id, { value: sceneName });
    } catch (error) {
      console.error('Failed to switch scene:', error);
      updateWidgetState(id, { error: 'Failed to switch scene' });
    }
  }, [id, updateWidgetState]);

  const sortedScenes = useMemo(
    () => [...scenes].sort((a, b) => a.sceneName.localeCompare(b.sceneName)),
    [scenes]
  );

  const SceneRow = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const scene = sortedScenes[index];
    return (
      <div style={style}>
        <button
          onClick={() => switchScene(scene.sceneName)}
          className={`w-full p-2 rounded transition-colors text-left ${currentScene === scene.sceneName ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-foreground'}`}
        >
          {scene.sceneName}
        </button>
      </div>
    );
  };

  return (
    <div className="p-4 bg-card rounded-lg shadow-lg max-w-sm mx-auto h-full flex flex-col">
      <h3 className="text-foreground text-lg font-bold mb-2 flex-shrink-0">Scene Switcher</h3>
      <div className="flex-grow mb-4" style={{ minHeight: '150px' }}>
        <List
          height={Math.max(150, scenes.length * 40)} // Dynamic height or a fixed one
          itemCount={sortedScenes.length}
          itemSize={40} // Height of each scene button + padding
          width="100%"
        >
          {SceneRow}
        </List>
      </div>
      {config.showItems && currentScene && (
        <div className="flex-shrink-0">
          <h4 className="text-foreground mb-2">Items in: {currentScene}</h4>
          <div className="text-muted-foreground text-sm space-y-1 max-h-40 overflow-y-auto">
            {sceneItems.length > 0 ? (
              sceneItems.map((item, index) => (
                <div key={index} className="p-1 bg-muted/70 rounded truncate">
                  {item.sourceName}
                </div>
              ))
            ) : (
              <div className="p-1 bg-muted/70 rounded">No items in scene</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default SceneSwitcherWidget;