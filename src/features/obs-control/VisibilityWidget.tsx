import React, { useState, useEffect } from 'react';
import { useUniversalWidgetStore } from '@/store/widgetsStore';
import { obsClient } from '@/services/obsClient';
import gsap from 'gsap';
import type { UniversalWidgetConfig } from '@/types/universalWidget';

interface VisibilityWidgetProps extends UniversalWidgetConfig {
  config: { sceneName?: string; sceneItemId?: string };
  id: string;
  className?: string;
}

const VisibilityWidget: React.FC<VisibilityWidgetProps> = ({ config, id }) => {
  const { updateWidgetState } = useUniversalWidgetStore();
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  const sceneName = config.sceneName || '';
  const sceneItemId = config.sceneItemId || '';

  const toggleVisibility = async () => {
    setLoading(true);
    try {
      const newVisible = !isVisible;
      await obsClient.call('SetSceneItemEnabled', { sceneName, sceneItemId, sceneItemEnabled: newVisible });
      setIsVisible(newVisible);
      updateWidgetState(id, { value: newVisible });
      // Animate the button with GSAP
      gsap.to('.visibility-btn', { scale: newVisible ? 1 : 0.9, duration: 0.2 });
    } catch (error) {
      console.error('Failed to toggle visibility:', error);
      updateWidgetState(id, { error: 'Failed to toggle visibility' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg shadow-lg max-w-sm mx-auto">
      <h3 className="text-white text-lg font-bold mb-2">Visibility Widget</h3>
      <button
        className={`w-full p-2 rounded text-white visibility-btn ${isVisible ? 'bg-green-500' : 'bg-red-500'} disabled:bg-gray-500`}
        onClick={toggleVisibility}
        disabled={loading}
      >
        {loading ? 'Applying...' : (isVisible ? 'Visible' : 'Hidden')}
      </button>
      <div className="text-gray-300 text-sm mt-2">
        Scene: {sceneName} - Item: {sceneItemId}
      </div>
    </div>
  );
};

export default VisibilityWidget;