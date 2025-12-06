import React, { useEffect, useRef, useState } from 'react';
import { EmoteWallEngine } from '../core/EmoteWallEngine';
import { useEmoteWallConfig } from '@/app/store/emoteWallStore';
import { chatEngine } from '@/features/chat/core/ChatEngine';

const EmoteWall: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [engine, setEngine] = useState<EmoteWallEngine | null>(null);
  const config = useEmoteWallConfig();

  // Initialize engine and connect to chat
  useEffect(() => {
    if (containerRef.current) {
      const emoteWallEngine = new EmoteWallEngine(containerRef.current);
      emoteWallEngine.connectToChat(chatEngine);
      setEngine(emoteWallEngine);
    }
  }, []);

  // Update engine config when it changes
  useEffect(() => {
    if (engine) {
      engine.setConfig(config);
    }
  }, [engine, config]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden"
      id="emote-wall-scene"
    >
      {/* Emotes will be rendered here by the engine */}
    </div>
  );
};

export default EmoteWall;