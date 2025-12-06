import React, { useState, useEffect } from 'react';
import { useUniversalWidgetStore } from '@/app/store/widgetsStore';
import { obsClient } from '@/shared/services/obsClient';
import type { UniversalWidgetConfig } from '@/shared/types/universalWidget';
import { Input } from '@/shared/components/ui/input';

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
    <div className="p-4 bg-card rounded-lg shadow-lg max-w-sm mx-auto">
      <h3 className="text-foreground text-lg font-bold mb-2">Scene Organizer: {sceneName}</h3>
      <Input
        type="text"
        value={sceneName}
        onChange={(e) => setSceneName(e.target.value)}
        placeholder="Enter scene name"
        className="mb-4"
      />
      <div className="space-y-2 max-h-60 overflow-y-auto border-2 border-border rounded p-2">
        {sources.length === 0 ? (
          <div className="p-1 bg-input rounded text-muted-foreground">No items in scene</div>
        ) : (
          sources.map((item, index) => (
            <div
              key={item.sourceName}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-center justify-between p-2 bg-input rounded cursor-move ${dragIndex === index ? 'ring-2 ring-accent' : ''}`}
            >
              <span className="text-foreground text-sm flex-1">{item.sourceName}</span>
              <div className="space-x-1">
                <span className="text-muted-foreground text-xs">Drag to reorder</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SceneOrganizerWidget;