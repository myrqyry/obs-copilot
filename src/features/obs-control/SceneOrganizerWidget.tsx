import React, { useState, useEffect } from 'react';
import { useUniversalWidgetStore } from '@/store/widgetsStore';
import { obsClient } from '@/services/obsClient';
import type { UniversalWidgetConfig } from '@/types/universalWidget';

interface SceneItem {
  sceneItemId: string;
  sourceName: string;
  visible: boolean;
}

interface SceneOrganizerWidgetProps extends UniversalWidgetConfig {
  config: { sceneName?: string };
  id: string;
  className?: string;
}

const SceneOrganizerWidget: React.FC<SceneOrganizerWidgetProps> = ({ config, id }) => {
  const { updateWidgetState } = useUniversalWidgetStore();
  const [sceneName, setSceneName] = useState<string>(config.sceneName || '');
  const [sceneItems, setSceneItems] = useState<SceneItem[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (sceneName) {
      fetchSceneItems();
    }
  }, [sceneName]);

  const fetchSceneItems = async () => {
    try {
      const response = await obsClient.call('GetSceneItemList', { sceneName });
      setSceneItems(response.sceneItems || []);
    } catch (error) {
      console.error('Failed to fetch scene items:', error);
      setSceneItems([]);
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) return;

    setLoading(true);
    try {
      const draggedItemId = sceneItems[dragIndex].sceneItemId;
      await obsClient.call('SetSceneItemIndex', { sceneName, sceneItemId: draggedItemId, sceneItemIndex: dropIndex });
      const newItems = [...sceneItems];
      const [draggedItem] = newItems.splice(dragIndex, 1);
      newItems.splice(dropIndex, 0, draggedItem);
      setSceneItems(newItems);
      setDragIndex(null);
      updateWidgetState(id, { value: newItems });
    } catch (error) {
      console.error('Failed to reorder scene item:', error);
      updateWidgetState(id, { error: 'Failed to reorder scene item' });
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg shadow-lg max-w-sm mx-auto">
      <h3 className="text-white text-lg font-bold mb-2">Scene Organizer: {sceneName}</h3>
      <input
        type="text"
        placeholder="Scene Name"
        value={sceneName}
        onChange={(e) => setSceneName(e.target.value)}
        className="w-full p-2 mb-4 bg-gray-700 text-white rounded"
      />
      <div
        className="space-y-2 max-h-60 overflow-y-auto border-2 border-dashed border-gray-600 rounded p-2"
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, dragIndex ?? 0)}
      >
        {sceneItems.map((item, index) => (
          <div
            key={item.sceneItemId}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            className={`flex items-center justify-between p-2 bg-gray-700 rounded cursor-move ${dragIndex === index ? 'ring-2 ring-blue-500' : ''}`}
          >
            <span className="text-white text-sm flex-1">{item.sourceName}</span>
            <div className="space-x-1">
              <span className="text-white text-xs">Drag to reorder</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SceneOrganizerWidget;