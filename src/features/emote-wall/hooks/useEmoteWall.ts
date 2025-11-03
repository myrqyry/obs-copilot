import { useState, useEffect } from 'react';
import { EmoteWallEngine } from '../core/EmoteWallEngine';
import useConnectionsStore from '@/store/connections';
import { chatEngine } from '@/features/chat/core/ChatEngine';
import useEmoteWallStore from '@/store/emoteWallStore';

export const useEmoteWall = (containerRef: React.RefObject<HTMLDivElement>) => {
  const [emoteWallEngine, setEmoteWallEngine] = useState<EmoteWallEngine | null>(null);
  const obsConnection = useConnectionsStore((state) => state.obsSocket);
  const { enabled, channel } = useEmoteWallStore();

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

  useEffect(() => {
    if (enabled && channel && chatEngine.currentProvider) {
      chatEngine.connect(channel);
    } else if (chatEngine.currentProvider) {
      chatEngine.disconnect();
    }

    return () => {
      if (chatEngine.currentProvider) {
        chatEngine.disconnect();
      }
    };
  }, [enabled, channel, chatEngine.currentProvider]);

  return emoteWallEngine;
};