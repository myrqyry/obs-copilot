import React, { useState, useCallback } from 'react';
import { useUniversalWidgetStore } from '@/app/store/widgetsStore';
import { obsClient } from '@/shared/services/obsClient';
import type { UniversalWidgetConfig } from '@/shared/types/universalWidget';

interface SceneItem {
  sourceName: string;
  isGroup: boolean;
  visible: boolean;
  xPos: number;
  yPos: number;
  width: number;
  height: number;
}

interface SceneCreatorWidgetProps extends UniversalWidgetConfig {
  config: { template?: string };
  id: string;
  className?: string;
}

const SceneCreatorWidget: React.FC<SceneCreatorWidgetProps> = ({ config, id }) => {
  const { updateWidgetState } = useUniversalWidgetStore();
  const [sceneName, setSceneName] = useState<string>('');
  const [sceneItems, setSceneItems] = useState<SceneItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const addItem = useCallback(() => {
    setSceneItems([...sceneItems, { sourceName: '', isGroup: false, visible: true, xPos: 0, yPos: 0, width: 100, height: 100 }]);
  }, [sceneItems]);

  const updateItem = useCallback((index: number, item: SceneItem) => {
    const newItems = [...sceneItems];
    newItems[index] = item;
    setSceneItems(newItems);
  }, [sceneItems]);

  const removeItem = useCallback((index: number) => {
    setSceneItems(sceneItems.filter((_, i) => i !== index));
  }, [sceneItems]);

  const createScene = async () => {
    if (!sceneName || sceneItems.length === 0) return;

    setLoading(true);
    try {
      await obsClient.call('CreateScene', { sceneName, sceneItems });
      updateWidgetState(id, { value: sceneName });
      setSceneName('');
      setSceneItems([]);
    } catch (error) {
      console.error('Failed to create scene:', error);
      updateWidgetState(id, { error: 'Failed to create scene' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (config.template) {
      // Load template - for simplicity, add a default item
      setSceneItems([{ sourceName: 'Template Item', isGroup: false, visible: true, xPos: 0, yPos: 0, width: 100, height: 100 }]);
    }
  }, [config.template]);

  return (
    <div className="p-4 bg-gray-800 rounded-lg shadow-lg max-w-md mx-auto">
      <h3 className="text-white text-lg font-bold mb-2">Scene Creator</h3>
      <input
        type="text"
        placeholder="Scene Name"
        value={sceneName}
        onChange={(e) => setSceneName(e.target.value)}
        className="w-full p-2 mb-4 bg-gray-700 text-white rounded"
      />
      <div className="space-y-2 mb-4">
        {sceneItems.map((item, index) => (
          <div key={index} className="p-2 bg-gray-700 rounded space-y-1">
            <input
              type="text"
              placeholder="Source Name"
              value={item.sourceName}
              onChange={(e) => updateItem(index, { ...item, sourceName: e.target.value })}
              className="w-full p-1 bg-gray-600 text-white rounded"
            />
            <div className="flex space-x-1">
              <input
                type="number"
                placeholder="X"
                value={item.xPos}
                onChange={(e) => updateItem(index, { ...item, xPos: Number(e.target.value) })}
                className="w-1/3 p-1 bg-gray-600 text-white rounded"
              />
              <input
                type="number"
                placeholder="Y"
                value={item.yPos}
                onChange={(e) => updateItem(index, { ...item, yPos: Number(e.target.value) })}
                className="w-1/3 p-1 bg-gray-600 text-white rounded"
              />
              <input
                type="number"
                placeholder="Width"
                value={item.width}
                onChange={(e) => updateItem(index, { ...item, width: Number(e.target.value) })}
                className="w-1/3 p-1 bg-gray-600 text-white rounded"
              />
            </div>
            <div className="flex space-x-1">
              <input
                type="number"
                placeholder="Height"
                value={item.height}
                onChange={(e) => updateItem(index, { ...item, height: Number(e.target.value) })}
                className="w-1/3 p-1 bg-gray-600 text-white rounded"
              />
              <label className="flex items-center space-x-1">
                <input
                  type="checkbox"
                  checked={item.visible}
                  onChange={(e) => updateItem(index, { ...item, visible: e.target.checked })}
                  className="checkbox checkbox-primary"
                />
                <span className="text-white text-sm">Visible</span>
              </label>
              <button
                onClick={() => removeItem(index)}
                className="w-1/3 p-1 bg-red-500 text-white rounded"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={addItem}
          className="w-full p-2 bg-green-500 text-white rounded"
        >
          Add Item
        </button>
      </div>
      <button
        onClick={createScene}
        disabled={loading || !sceneName || sceneItems.length === 0}
        className="w-full p-2 bg-blue-500 text-white rounded disabled:bg-gray-500"
      >
        {loading ? 'Creating...' : 'Create Scene'}
      </button>
    </div>
  );
};

export default SceneCreatorWidget;