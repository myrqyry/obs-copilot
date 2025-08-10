import React from 'react';
import { cn } from '@/lib/utils';
import { useLockStore } from '@/store/lockStore';

interface LockToggleProps {
  lockKey: string;
}

export const LockToggle: React.FC<LockToggleProps> = ({ lockKey }) => {
  const { isLocked, setLock } = useLockStore();

  return (
    <label className="flex items-center space-x-2 text-xs text-muted-foreground cursor-pointer group">
      <input
        type="checkbox"
        checked={isLocked(lockKey)}
        onChange={(e) => {
          e.stopPropagation(); // Prevent toggling parent collapsible
          setLock(lockKey, e.target.checked);
        }}
        className="appearance-none h-4 w-4 border-2 border-border rounded-sm bg-background
                   checked:bg-primary checked:border-transparent focus:outline-none
                   focus:ring-2 focus:ring-offset-0 focus:ring-ring focus:ring-opacity-50
                   transition duration-150 group-hover:border-border"
        title={isLocked(lockKey) ? 'Unlock section' : 'Lock section'}
      />
      <span className="group-hover:text-foreground transition-colors duration-200">
        <span className="mr-1">{isLocked(lockKey) ? '🔒' : '🔓'}</span>
        {isLocked(lockKey) ? 'Locked' : 'Lock'}
      </span>
    </label>
  );
};
