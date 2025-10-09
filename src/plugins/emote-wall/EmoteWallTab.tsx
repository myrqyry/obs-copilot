import React, { useRef } from 'react';
import EmoteWall from '@/features/emote-wall/components/EmoteWall';
import EmoteWallConfig from '@/features/emote-wall/components/EmoteWallConfig';
import { useEmoteWall } from '@/features/emote-wall/hooks/useEmoteWall';
import { useEmoteWallConfig } from '@/store/emoteWallStore';
import useEmoteWallStore from '@/store/emoteWallStore';

const EmoteWallTab: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engine = useEmoteWall(containerRef);
  const { enabled, theme } = useEmoteWallConfig();
  const { setEnabled } = useEmoteWallStore();

  // Pass config to engine
  React.useEffect(() => {
    if (engine) {
      engine.setConfig({ enabled, theme });
    }
  }, [engine, enabled, theme]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow relative" ref={containerRef}>
        <EmoteWall />
      </div>
      <div className="p-4 border-t border-border">
        <EmoteWallConfig />
        <div className="mt-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            <span>Enable Emote Wall</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default EmoteWallTab;