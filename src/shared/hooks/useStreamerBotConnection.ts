import { useState, useCallback } from 'react';
import { StreamerBotService } from '@/shared/services/streamerBotService';
import { useChatStore } from '@/app/store/chatStore';
import { useAutomationStore } from '@/app/store/automationStore';
import { toast } from '@/shared/components/ui/toast';

import { handleAppError, createToastError } from '../lib/errorUtils'; // Import error utilities

export const useStreamerBotConnection = (streamerBotService: StreamerBotService) => {
  const [isStreamerBotConnected, setIsStreamerBotConnected] = useState<boolean>(false);
  const [isStreamerBotConnecting, setIsStreamerBotConnecting] = useState<boolean>(false);
  const { addMessage } = useChatStore((state) => state.actions);
  const { setStreamerBotServiceInstance } = useAutomationStore((state) => state.actions);

  /**
   * Handles the connection process to Streamer.bot WebSocket.
   * @param address The Streamer.bot WebSocket address.
   * @param port The Streamer.bot WebSocket port.
   */
  const handleStreamerBotConnect = useCallback(
    async (address: string, port: string) => {
      if (!address.trim() || !port.trim()) {
        addMessage({
          role: 'system',
          text: '⚠️ Please provide both Streamer.bot address and port.',
        });
        toast(createToastError(
          'Streamer.bot Connection',
          'Please provide both Streamer.bot address and port.'
        ));
        return;
      }

      if (isStreamerBotConnected || streamerBotService.isConnected()) {
        addMessage({ role: 'system', text: '🤖 Already connected to Streamer.bot.' });
        toast({
          title: 'Streamer.bot Connection',
          description: 'Already connected to Streamer.bot.',
          variant: 'default',
        });
        return;
      }

      setIsStreamerBotConnecting(true);
      try {
        await streamerBotService.connect(address, parseInt(port, 10));
        setIsStreamerBotConnected(true);
        setStreamerBotServiceInstance(streamerBotService);
        addMessage({ role: 'system', text: '✅ Streamer.bot connection successful!' });
        toast({
          title: 'Streamer.bot Connection',
          description: 'Streamer.bot connection successful!',
          variant: 'default',
        });
      } catch (error: unknown) {
        const errorMessage = handleAppError('Streamer.bot connection', error);
        addMessage({ role: 'system', text: `⚠️ ${errorMessage}.` });
        setIsStreamerBotConnected(false);
        toast(createToastError(
          'Streamer.bot Connection Failed',
          errorMessage
        ));
      } finally {
        setIsStreamerBotConnecting(false);
      }
    },
    [isStreamerBotConnected, streamerBotService, addMessage, setStreamerBotServiceInstance],
  );

  /**
   * Handles the disconnection process from Streamer.bot WebSocket.
   */
  const handleStreamerBotDisconnect = useCallback(() => {
    try {
      if (isStreamerBotConnected) {
        streamerBotService.disconnect();
        setIsStreamerBotConnected(false);
        setStreamerBotServiceInstance(null);
        addMessage({ role: 'system', text: '🤖 Streamer.bot disconnected.' });
        toast({
          title: 'Streamer.bot Disconnected',
          description: 'Streamer.bot disconnected.',
          variant: 'default',
        });
      }
    } catch (error: unknown) {
      const errorMessage = handleAppError('Streamer.bot disconnection', error);
      toast(createToastError(
        'Streamer.bot Disconnection Error',
        errorMessage
      ));
    }
  }, [isStreamerBotConnected, streamerBotService, addMessage, setStreamerBotServiceInstance]);

  return {
    isStreamerBotConnected,
    isStreamerBotConnecting,
    handleStreamerBotConnect,
    handleStreamerBotDisconnect,
  };
};

// This hook primarily provides the connection/disconnection handlers for Streamer.bot,
// and the component using this hook (e.g., ConnectionPanel.tsx) is responsible
// for invoking these handlers and managing the connection lifecycle.
// Therefore, no direct cleanup is needed within this hook's useEffects as it only provides callbacks.
// The `streamerBotService` instance handles its own internal cleanup through its `disconnect` method.
