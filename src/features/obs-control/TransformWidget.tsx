import React, { useState, useEffect, useCallback } from 'react';
import { useUniversalWidgetStore } from '@/store/widgetsStore';
import { obsClient } from '@/services/obsClient';
import type { UniversalWidgetConfig } from '@/types/universalWidget';

interface TransformWidgetProps extends UniversalWidgetConfig {
  config: { sceneName?: string; sceneItemId?: string };
  id: string;
  className?: string;
}

const TransformWidget: React.FC<TransformWidgetProps> = ({ config, id }) => {
  const { updateWidgetState } = useUniversalWidgetStore();
  const [transforms, setTransforms] = useState<Record<string, any>>({});
  const [xPos, setXPos] = useState<number>(0);
  const [yPos, setYPos] = useState<number>(0);
  const [rotation, setRotation] = useState<number>(0);
  const [scaleX, setScaleX] = useState<number>(1);
  const [scaleY, setScaleY] = useState<number>(1);
  const [cropLeft, setCropLeft] = useState<number>(0);
  const [cropRight, setCropRight] = useState<number>(0);
  const [cropTop, setCropTop] = useState<number>(0);
  const [cropBottom, setCropBottom] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const sceneName = config.sceneName || '';
  const sceneItemId = config.sceneItemId || '';

  useEffect(() => {
    if (sceneName && sceneItemId) {
      fetchTransform();
    }
  }, [sceneName, sceneItemId]);

  const fetchTransform = async () => {
    try {
      const response = await obsClient.call('GetSceneItemTransform', { sceneName, sceneItemId });
      setTransforms(response);
      setXPos(response.xPos || 0);
      setYPos(response.yPos || 0);
      setRotation(response.rotation || 0);
      setScaleX(response.scaleX || 1);
      setScaleY(response.scaleY || 1);
      setCropLeft(response.cropLeft || 0);
      setCropRight(response.cropRight || 0);
      setCropTop(response.cropTop || 0);
      setCropBottom(response.cropBottom || 0);
    } catch (error) {
      console.error('Failed to fetch transform:', error);
      updateWidgetState(id, { error: 'Failed to fetch transform' });
    }
  };

  const updateTransform = async () => {
    setLoading(true);
    try {
      const transform = { xPos, yPos, rotation, scaleX, scaleY, cropLeft, cropRight, cropTop, cropBottom };
      await obsClient.call('SetSceneItemTransform', { sceneName, sceneItemId, sceneItemTransform: transform });
      setTransforms(transform);
      updateWidgetState(id, { value: transform });
    } catch (error) {
      console.error('Failed to update transform:', error);
      updateWidgetState(id, { error: 'Failed to update transform' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg shadow-lg max-w-sm mx-auto">
      <h3 className="text-white text-lg font-bold mb-2">Transform Widget</h3>
      <div className="space-y-2 mb-4">
        <div className="grid grid-cols-2 gap-2">
          <label className="text-gray-300">X Position:</label>
          <input
            type="number"
            value={xPos}
            onChange={(e) => setXPos(Number(e.target.value))}
            className="p-1 bg-gray-700 text-white rounded"
          />
          <label className="text-gray-300">Y Position:</label>
          <input
            type="number"
            value={yPos}
            onChange={(e) => setYPos(Number(e.target.value))}
            className="p-1 bg-gray-700 text-white rounded"
          />
          <label className="text-gray-300">Rotation:</label>
          <input
            type="number"
            value={rotation}
            onChange={(e) => setRotation(Number(e.target.value))}
            className="p-1 bg-gray-700 text-white rounded"
          />
          <label className="text-gray-300">Scale X:</label>
          <input
            type="number"
            value={scaleX}
            onChange={(e) => setScaleX(Number(e.target.value))}
            className="p-1 bg-gray-700 text-white rounded"
            step="0.1"
          />
          <label className="text-gray-300">Scale Y:</label>
          <input
            type="number"
            value={scaleY}
            onChange={(e) => setScaleY(Number(e.target.value))}
            className="p-1 bg-gray-700 text-white rounded"
            step="0.1"
          />
          <label className="text-gray-300">Crop Left:</label>
          <input
            type="number"
            value={cropLeft}
            onChange={(e) => setCropLeft(Number(e.target.value))}
            className="p-1 bg-gray-700 text-white rounded"
          />
          <label className="text-gray-300">Crop Right:</label>
          <input
            type="number"
            value={cropRight}
            onChange={(e) => setCropRight(Number(e.target.value))}
            className="p-1 bg-gray-700 text-white rounded"
          />
          <label className="text-gray-300">Crop Top:</label>
          <input
            type="number"
            value={cropTop}
            onChange={(e) => setCropTop(Number(e.target.value))}
            className="p-1 bg-gray-700 text-white rounded"
          />
          <label className="text-gray-300">Crop Bottom:</label>
          <input
            type="number"
            value={cropBottom}
            onChange={(e) => setCropBottom(Number(e.target.value))}
            className="p-1 bg-gray-700 text-white rounded"
          />
        </div>
        <button
          onClick={updateTransform}
          disabled={loading}
          className="w-full p-2 bg-primary hover:bg-primary/90 text-white rounded disabled:bg-muted disabled:text-muted-foreground mt-4 transition-colors"
        >
          {loading ? 'Applying...' : 'Apply Transform'}
        </button>
      </div>
      <div className="text-gray-300 text-sm">
        Scene: {sceneName} - Item: {sceneItemId}
      </div>
    </div>
  );
};

export default TransformWidget;