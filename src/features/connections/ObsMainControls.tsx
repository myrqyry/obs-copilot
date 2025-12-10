import React from 'react';
import { StreamControlCard } from './components/StreamControlCard';
import { ScenesCard } from './components/ScenesCard';
import { SourcesCard } from './components/SourcesCard';
import { VideoSettingsCard } from './components/VideoSettingsCard';
import { StatsCard } from './components/StatsCard';
import { LoadingSpinner } from '@/shared/components/common/LoadingSpinner';
import useConnectionsStore from '@/app/store/connections';

export const ObsMainControls: React.FC = () => {
  // Only subscribe to connection status and loading state here.
  // We avoid subscribing to rapidly changing data (streamStatus) at this level.
  const isConnected = useConnectionsStore((state) => state.isConnected);
  const isConnecting = useConnectionsStore((state) => state.connecting);

  if (isConnecting) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner size={12} /></div>;
  }

  if (!isConnected) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <h3 className="text-lg font-semibold">OBS Disconnected</h3>
        <p>Please check your connection settings.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto">
      <StreamControlCard />
      <ScenesCard />
      <SourcesCard />
      <VideoSettingsCard />
      <StatsCard />
    </div>
  );
};

export default ObsMainControls;