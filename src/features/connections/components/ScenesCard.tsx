import React, { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '@/shared/components/ui/Button';
import { AddToContextButton } from '@/shared/components/common/AddToContextButton';
import { LockToggle } from '@/shared/components/common/LockToggle';
import { CollapsibleCard } from '@/shared/components/common/CollapsibleCard';
import useConnectionsStore from '@/app/store/connections';
import { useLockStore } from '@/app/store/lockStore';
import { obsClient } from '@/shared/services/obsClient';
import { useChatStore } from '@/app/store/chatStore';

export const ScenesCard: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const { isLocked } = useLockStore();
  const addSystemMessage = useChatStore((state) => state.actions.addSystemMessageToChat);

  // Selector focuses only on scenes data
  const { scenes, currentProgramScene } = useConnectionsStore(
    useShallow((state) => ({
      scenes: state.scenes,
      currentProgramScene: state.currentScene,
    }))
  );

  const handleSetCurrentScene = (sceneName: string) => {
    obsClient.call('SetCurrentProgramScene', { sceneName }).catch(console.error);
  };

  return (
    <CollapsibleCard
      title="Scenes"
      emoji="🎬"
      className="relative group"
      isOpen={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
    >
      <div className="absolute top-1 right-1 sm:right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 flex gap-1">
        <LockToggle lockKey="scenes" />
      </div>
      <ul className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
        {scenes.map((scene) => {
          const isActive = scene.name === currentProgramScene;
          return (
            <li key={scene.name} className="flex flex-col sm:flex-row items-center justify-between gap-2 p-1 rounded hover:bg-muted/50">
              <span className={`truncate text-sm ${isActive ? 'font-bold text-primary' : ''}`}>
                {scene.name}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  onClick={() => handleSetCurrentScene(scene.name)}
                  disabled={isLocked('scenes') || isActive}
                  variant={isActive ? 'secondary' : 'outline'}
                  size="sm"
                  className="h-7 text-xs"
                >
                  {isActive ? 'Active' : 'Switch'}
                </Button>
                <AddToContextButton
                  contextText={`OBS Scene: '${scene.name}'${isActive ? ' (currently active)' : ''}`}
                  onAddToContext={addSystemMessage}
                  disabled={isLocked('scenes')}
                  className="h-7 w-7"
                />
              </div>
            </li>
          );
        })}
      </ul>
    </CollapsibleCard>
  );
};