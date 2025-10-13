import React, { useState, useEffect, useCallback } from 'react';
import { useUniversalWidgetStore } from '@/store/widgetsStore';
import { obsClient } from '@/services/obsClient';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/Button';
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
    <div className="p-4 bg-card rounded-lg shadow-lg max-w-sm mx-auto">
      <h3 className="text-foreground text-lg font-bold mb-2">Transform Widget</h3>
      <div className="space-y-2 mb-4">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>X Position:</Label>
            <Input
              type="number"
              value={xPos}
              onChange={(e) => setXPos(Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Y Position:</Label>
            <Input
              type="number"
              value={yPos}
              onChange={(e) => setYPos(Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Rotation:</Label>
            <Input
              type="number"
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Scale X:</Label>
            <Input
              type="number"
              value={scaleX}
              onChange={(e) => setScaleX(Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Scale Y:</Label>
            <Input
              type="number"
              value={scaleY}
              onChange={(e) => setScaleY(Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Crop Left:</Label>
            <Input
              type="number"
              value={cropLeft}
              onChange={(e) => setCropLeft(Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Crop Right:</Label>
            <Input
              type="number"
              value={cropRight}
              onChange={(e) => setCropRight(Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Crop Top:</Label>
            <Input
              type="number"
              value={cropTop}
              onChange={(e) => setCropTop(Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Crop Bottom:</Label>
            <Input
              type="number"
              value={cropBottom}
              onChange={(e) => setCropBottom(Number(e.target.value))}
            />
          </div>
        </div>
      </div>
      <Button
        onClick={updateTransform}
        disabled={!obsClient.isConnected() || !sceneName}
        className="w-full mt-4"
      >
        Apply Transform
      </Button>
      <div className="text-muted-foreground text-sm">
        Current Source: {sceneName || 'None Selected'}
      </div>
    </div>
  );
};

export default TransformWidget;