import React, { useState, useEffect } from 'react';
import { BaseWidget } from './BaseWidget';
import { UniversalWidgetConfig } from '@/types/universalWidget';
import useConnectionsStore from '@/store/connectionsStore';
import { logger } from '@/utils/logger';

interface StatusWidgetProps {
  config: UniversalWidgetConfig;
}

const StatusWidget: React.FC<StatusWidgetProps> = ({ config }) => {
  const { obs: obsClient, isConnected: isObsConnected } = useConnectionsStore();
  const [currentStatus, setCurrentStatus] = useState('Unknown');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch current scene on mount
  useEffect(() => {
    const fetchCurrentStatus = async () => {
      if (!isObsConnected || !obsClient) {
        setErrorMessage('OBS not connected');
        setCurrentStatus('Not connected');
        return;
      }

      try {
        // Get current scene
        const response = await obsClient.call('GetCurrentScene');
        setCurrentStatus(response.currentScene || 'No scene');
        logger.info(`Current scene: ${response.currentScene}`);
      } catch (error: any) {
        logger.error(`Failed to fetch current scene: ${error.message}`);
        setErrorMessage('Failed to fetch current scene');
        setCurrentStatus('Error fetching status');
      }
    };

    fetchCurrentStatus();
  }, [isObsConnected, obsClient]);

  if (!isObsConnected) {
    return (
      <BaseWidget config={config}>
        <div className="flex flex-col gap-2 p-2 rounded-md border opacity-50">
          <label className="text-sm font-medium">Status</label>
          <div className="text-gray-500">Not connected to OBS</div>
        </div>
      </BaseWidget>
    );
  }

  return (
    <BaseWidget config={config}>
      <div className="flex flex-col gap-2 p-2 rounded-md border">
        <label className="text-sm font-medium">Current Scene</label>
        <p className="text-base">{currentStatus}</p>
        {errorMessage && <p className="text-destructive text-xs mt-1">{errorMessage}</p>}
      </div>
    </BaseWidget>
  );
};

export default StatusWidget;