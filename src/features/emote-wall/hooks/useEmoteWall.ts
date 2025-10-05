import { useState, useEffect } from 'react';
import { EmoteWallEngine } from '../core/EmoteWallEngine';
import { useConnectionsStore } from '@/store/connectionsStore';
import { chatEngine } from '@/features/chat/core/ChatEngine';

export const useEmoteWall = (containerRef: React.RefObject<HTMLDivElement>) => {
  const [emoteWallEngine, setEmoteWallEngine] = useState<EmoteWallEngine | null>(null);
  const obsConnection = useConnectionsStore((state) => state.obsSocket);

  useEffect(() => {
    if (containerRef.current) {
      const engine = new EmoteWallEngine(containerRef.current);
      setEmoteWallEngine(engine);

      // Connect to chat
      engine.connectToChat(chatEngine);

      // Connect to OBS
      if (obsConnection) {
        engine.connectToOBS(obsConnection);
      }
    }
  }, [containerRef, obsConnection]);

  return emoteWallEngine;
};