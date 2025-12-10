import React, { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { CollapsibleCard } from '@/shared/components/common/CollapsibleCard';
import { LockToggle } from '@/shared/components/common/LockToggle';
import useConnectionsStore from '@/app/store/connections';

// Helper to format duration
const formatDuration = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const StatsCard: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Use shallow to only re-render if specific properties of streamStatus change
  // or if the reference changes (which it does on every tick from OBS)
  const streamStatus = useConnectionsStore((state) => state.streamStatus);

  if (!streamStatus) return null;

  return (
    <CollapsibleCard
      title="OBS Statistics"
      emoji="📊"
      className="relative group"
      isOpen={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
    >
      <div className="absolute top-1 right-1 sm:right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 flex gap-1">
        <LockToggle lockKey="stats" />
      </div>
      <div className="text-sm space-y-1">
        <div className="grid grid-cols-2 gap-4">
            <div>
                <span className="text-muted-foreground">Status:</span>{' '}
                <span className={streamStatus.outputActive ? 'text-success font-medium' : 'text-muted-foreground'}>
                    {streamStatus.outputActive ? '🟢 Live' : '🔴 Stopped'}
                </span>
            </div>
            <div>
                 <span className="text-muted-foreground">Bitrate:</span>{' '}
                 <span>{((streamStatus.outputBytes * 8) / (streamStatus.outputDuration / 1000) / 1000).toFixed(0)} kbps</span>
            </div>
            <div>
                <span className="text-muted-foreground">Time:</span>{' '}
                <span className="font-mono">{formatDuration(streamStatus.outputDuration || 0)}</span>
            </div>
            <div>
                <span className="text-muted-foreground">Data:</span>{' '}
                <span>{(streamStatus.outputBytes / 1024 / 1024).toFixed(1)} MB</span>
            </div>
        </div>
      </div>
    </CollapsibleCard>
  );
};