import { useState, useEffect, useCallback } from 'react';
import { chatEngine } from '../core/ChatEngine';
import { TwitchProvider } from '../providers/TwitchProvider';
import type { ChatMessage } from '../core/types';

export const useChat = (providerType: 'twitch' | 'youtube' = 'twitch') => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Memoize the event handlers to prevent re-subscribing on every render
  const handleMessage = useCallback((event: Event) => {
    const customEvent = event as CustomEvent<ChatMessage>;
    setMessages(prevMessages => [...prevMessages, customEvent.detail]);
  }, []);

  const handleConnected = useCallback(() => {
    setIsConnected(true);
    // Load historical messages if the provider supports it
    setMessages(chatEngine.getHistory());
  }, []);

  const handleDisconnected = useCallback(() => {
    setIsConnected(false);
    setMessages([]); // Clear messages on disconnect
  }, []);

  useEffect(() => {
    // Set the provider when the hook mounts or when the providerType changes
    // For now, we only have Twitch
    if (providerType === 'twitch') {
      const twitchProvider = new TwitchProvider();
      chatEngine.setProvider(twitchProvider);
    }
    // else if (providerType === 'youtube') {
    //   const youtubeProvider = new YouTubeProvider();
    //   chatEngine.setProvider(youtubeProvider);
    // }

    // Subscribe to chat engine events
    chatEngine.addEventListener('message', handleMessage);
    chatEngine.addEventListener('connected', handleConnected);
    chatEngine.addEventListener('disconnected', handleDisconnected);

    // Clean up on unmount
    return () => {
      chatEngine.removeEventListener('message', handleMessage);
      chatEngine.removeEventListener('connected', handleConnected);
      chatEngine.removeEventListener('disconnected', handleDisconnected);
      chatEngine.disconnect();
    };
  }, [providerType, handleMessage, handleConnected, handleDisconnected]);

  const connect = useCallback((channel: string) => {
    chatEngine.connect(channel);
  }, []);

  const disconnect = useCallback(() => {
    chatEngine.disconnect();
  }, []);

  const sendMessage = useCallback((message: string) => {
    chatEngine.sendMessage(message);
  }, []);

  return {
    messages,
    isConnected,
    connect,
    disconnect,
    sendMessage,
  };
};