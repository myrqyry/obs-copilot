import { useSyncExternalStore, useCallback, useMemo } from 'react';
import { chatEngine } from '../core/ChatEngine';
import { TwitchProvider } from '../providers/TwitchProvider';
import type { ChatMessage } from '../core/types';


  // Set the provider when the hook mounts or when the providerType changes
  useMemo(() => {
    if (providerType === 'twitch' && chatEngine.currentProvider?.platform !== 'twitch') {
      const twitchProvider = new TwitchProvider();
      chatEngine.setProvider(twitchProvider);
    }
    // Add other providers as needed
  }, [providerType]);

  // Use useSyncExternalStore for messages
  const messages = useSyncExternalStore(
    (callback) => {
      chatEngine.addEventListener('message', callback);
      chatEngine.addEventListener('connected', callback);
      chatEngine.addEventListener('disconnected', callback);
      return () => {
        chatEngine.removeEventListener('message', callback);
        chatEngine.removeEventListener('connected', callback);
        chatEngine.removeEventListener('disconnected', callback);
      };
    },
    () => chatEngine.getHistory(),
    () => [] as ChatMessage[]
  );

  // Use useSyncExternalStore for connection status
  const isConnected = useSyncExternalStore(
    (callback) => {
      chatEngine.addEventListener('connected', callback);
      chatEngine.addEventListener('disconnected', callback);
      return () => {
        chatEngine.removeEventListener('connected', callback);
        chatEngine.removeEventListener('disconnected', callback);
      };
    },
    () => !!chatEngine.currentProvider
  );

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