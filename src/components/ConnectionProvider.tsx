import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { StreamerBotService } from '@/services/streamerBotService';
import { ObsClientImpl } from '@/services/obsClient';
import { useChatStore } from '@/store/chatStore';
import { useAutomationStore } from '@/store/automationStore';
import useConnectionsStore from '@/store/connectionsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { toast } from '@/components/ui/toast';
import { loadConnectionSettings, saveConnectionSettings, isStorageAvailable } from '@/utils/persistence';
import { DEFAULT_OBS_WEBSOCKET_URL } from '@/constants';

interface ConnectionContextType {
  streamerBotService: StreamerBotService;
  obsClient: ObsClientImpl;
  isStreamerBotConnected: boolean;
  isStreamerBotConnecting: boolean;
  isObsConnected: boolean;
  isObsConnecting: boolean;
  handleStreamerBotConnect: (address: string, port: string) => Promise<void>;
  handleStreamerBotDisconnect: () => void;
  handleObsConnect: (url: string, password?: string) => Promise<void>;
  handleObsDisconnect: () => void;
  streamerBotAddress: string;
  streamerBotPort: string;
  obsWebSocketUrl: string;
  obsWebSocketPassword?: string;
  setStreamerBotAddress: (address: string) => void;
  setStreamerBotPort: (port: string) => void;
  setObsWebSocketUrl: (url: string) => void;
  setObsWebSocketPassword: (password: string) => void;
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);

export const ConnectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addMessage } = useChatStore((state) => state.actions);
  const { setStreamerBotServiceInstance } = useAutomationStore((state) => state.actions);
  // Only grab the setters we actually use to avoid unused-var TS errors
  const { setConnected: setStreamerBotConnected } = useConnectionsStore();
  const { setConnected: setObsConnected } = useConnectionsStore();
  const { obsWebSocketUrl, obsWebSocketPassword, actions } = useSettingsStore();
  const { setObsWebSocketUrl, setObsWebSocketPassword } = actions;

  const [streamerBotAddress, setStreamerBotAddress] = useState<string>(
    isStorageAvailable() ? (loadConnectionSettings().streamerBotAddress || 'localhost') : 'localhost'
  );
  const [streamerBotPort, setStreamerBotPort] = useState<string>(
    isStorageAvailable() ? (loadConnectionSettings().streamerBotPort || '8080') : '8080'
  );

  const [isStreamerBotConnecting, setIsStreamerBotConnecting] = useState<boolean>(false);
  const [isObsConnecting, setIsObsConnecting] = useState<boolean>(false);

  const streamerBotService = StreamerBotService.getInstance();
  const obsClient = ObsClientImpl.getInstance();

  // Streamer.bot Connection Logic
  const handleStreamerBotConnect = useCallback(
    async (address: string, port: string) => {
      if (!address.trim() || !port.trim()) {
        addMessage({
          role: 'system',
          text: '⚠️ Please provide both Streamer.bot address and port.',
        });
        toast({
          title: 'Streamer.bot Connection',
          description: 'Please provide both Streamer.bot address and port.',
          variant: 'destructive',
        });
        return;
      }

      if (streamerBotService.isConnected()) {
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
        setStreamerBotConnected(true);
        setStreamerBotServiceInstance(streamerBotService);
        addMessage({ role: 'system', text: '✅ Streamer.bot connection successful!' });
        toast({
          title: 'Streamer.bot Connection',
          description: 'Streamer.bot connection successful!',
          variant: 'default',
        });
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred.';
        console.error('Streamer.bot connection failed:', error);
        addMessage({ role: 'system', text: `⚠️ Streamer.bot connection failed: ${errorMessage}.` });
        setStreamerBotConnected(false);
        toast({
          title: 'Streamer.bot Connection Failed',
          description: `Streamer.bot connection failed: ${errorMessage}`,
          variant: 'destructive',
        });
      } finally {
        setIsStreamerBotConnecting(false);
      }
    },
    [streamerBotService, addMessage, setStreamerBotConnected, setStreamerBotServiceInstance],
  );

  const handleStreamerBotDisconnect = useCallback(() => {
    try {
      if (streamerBotService.isConnected()) {
        streamerBotService.disconnect();
        setStreamerBotConnected(false);
        setStreamerBotServiceInstance(null);
        addMessage({ role: 'system', text: '🤖 Streamer.bot disconnected.' });
        toast({
          title: 'Streamer.bot Disconnected',
          description: 'Streamer.bot disconnected.',
          variant: 'default',
        });
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred.';
      console.error('Error disconnecting from Streamer.bot:', error);
      toast({
        title: 'Streamer.bot Disconnection Error',
        description: `Error disconnecting from Streamer.bot: ${errorMessage}`,
        variant: 'destructive',
      });
    }
  }, [
    streamerBotService,
    addMessage,
    setStreamerBotConnected,
    setStreamerBotServiceInstance,
  ]);

  // OBS Connection Logic
  const handleObsConnect = useCallback(
    async (url: string, password?: string) => {
      if (!url.trim()) {
        addMessage({
          role: 'system',
          text: '⚠️ Please provide OBS WebSocket URL.',
        });
        toast({
          title: 'OBS Connection',
          description: 'Please provide OBS WebSocket URL.',
          variant: 'destructive',
        });
        return;
      }

      if (obsClient.isConnected()) {
        addMessage({ role: 'system', text: '📺 Already connected to OBS.' });
        toast({
          title: 'OBS Connection',
          description: 'Already connected to OBS.',
          variant: 'default',
        });
        return;
      }

      setIsObsConnecting(true);
      try {
        await obsClient.connect(url, password);
        setObsConnected(true);
        addMessage({ role: 'system', text: '✅ OBS connection successful!' });
        toast({
          title: 'OBS Connection',
          description: 'OBS connection successful!',
          variant: 'default',
        });
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred.';
        console.error('OBS connection failed:', error);
        addMessage({ role: 'system', text: `⚠️ OBS connection failed: ${errorMessage}.` });
        setObsConnected(false);
        toast({
          title: 'OBS Connection Failed',
          description: `OBS connection failed: ${errorMessage}`,
          variant: 'destructive',
        });
      } finally {
        setIsObsConnecting(false);
      }
    },
    [obsClient, addMessage, setObsConnected],
  );

  const handleObsDisconnect = useCallback(() => {
    try {
      if (obsClient.isConnected()) {
        obsClient.disconnect();
        setObsConnected(false);
        addMessage({ role: 'system', text: '📺 OBS disconnected.' });
        toast({
          title: 'OBS Disconnected',
          description: 'OBS disconnected.',
          variant: 'default',
        });
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred.';
      console.error('Error disconnecting from OBS:', error);
      toast({
        title: 'OBS Disconnection Error',
        description: `Error disconnecting from OBS: ${errorMessage}`,
        variant: 'destructive',
      });
    }
  }, [obsClient, addMessage, setObsConnected]);

  // Initial connection attempts and listeners
  useEffect(() => {
    const storedSettings = isStorageAvailable() ? loadConnectionSettings() : {};
    const initialStreamerBotAddress = storedSettings.streamerBotAddress || 'localhost';
    const initialStreamerBotPort = storedSettings.streamerBotPort || '8080';
    const initialObsWebSocketUrl = obsWebSocketUrl || DEFAULT_OBS_WEBSOCKET_URL;
    const initialObsWebSocketPassword = obsWebSocketPassword || '';

    setStreamerBotAddress(initialStreamerBotAddress);
    setStreamerBotPort(initialStreamerBotPort);
    setObsWebSocketUrl(initialObsWebSocketUrl);
    setObsWebSocketPassword(initialObsWebSocketPassword);

    // Attempt to connect to Streamer.bot on mount
    handleStreamerBotConnect(initialStreamerBotAddress, initialStreamerBotPort);

    // Attempt to connect to OBS on mount
    handleObsConnect(initialObsWebSocketUrl, initialObsWebSocketPassword);

    // Streamer.bot listeners
    streamerBotService.on('Connected', () => {
      setStreamerBotConnected(true);
      addMessage({ role: 'system', text: '✅ Streamer.bot WebSocket connected.' });
    });
    streamerBotService.on('Disconnected', () => {
      setStreamerBotConnected(false);
      addMessage({ role: 'system', text: '❌ Streamer.bot WebSocket disconnected.' });
    });
    streamerBotService.on('Error', (error: any) => {
      addMessage({ role: 'system', text: `⚠️ Streamer.bot WebSocket error: ${error.message}` });
    });

    // OBS listeners
    obsClient.on('Connected', () => {
      setObsConnected(true);
      addMessage({ role: 'system', text: '✅ OBS WebSocket connected.' });
    });
    obsClient.on('Disconnected', () => {
      setObsConnected(false);
      addMessage({ role: 'system', text: '❌ OBS WebSocket disconnected.' });
    });
    obsClient.on('Error', (error: any) => {
      addMessage({ role: 'system', text: `⚠️ OBS WebSocket error: ${error.message}` });
    });

    // Cleanup on unmount
    return () => {
      streamerBotService.disconnect();
      obsClient.disconnect();
      streamerBotService.off('Connected', () => {});
      streamerBotService.off('Disconnected', () => {});
      streamerBotService.off('Error', () => {});
      obsClient.off('Connected', () => {});
      obsClient.off('Disconnected', () => {});
      obsClient.off('Error', () => {});
    };
  }, [
    addMessage,
    setStreamerBotConnected,
    setObsConnected,
    handleStreamerBotConnect,
    handleObsConnect,
    streamerBotService,
    obsClient,
    obsWebSocketUrl,
    obsWebSocketPassword,
    setObsWebSocketUrl,
    setObsWebSocketPassword,
  ]);

  // Save connection settings on change
  useEffect(() => {
    saveConnectionSettings({
      streamerBotAddress,
      streamerBotPort,
      obsWebSocketUrl,
      obsWebSocketPassword,
    });
  }, [streamerBotAddress, streamerBotPort, obsWebSocketUrl, obsWebSocketPassword]);

  const contextValue: ConnectionContextType = {
    streamerBotService,
    obsClient,
    isStreamerBotConnected: streamerBotService.isConnected(),
    isStreamerBotConnecting,
    isObsConnected: obsClient.isConnected(),
    isObsConnecting,
    handleStreamerBotConnect,
    handleStreamerBotDisconnect,
    handleObsConnect,
    handleObsDisconnect,
    streamerBotAddress,
    streamerBotPort,
    obsWebSocketUrl,
    obsWebSocketPassword,
    setStreamerBotAddress,
    setStreamerBotPort,
    setObsWebSocketUrl,
    setObsWebSocketPassword,
  };

  return (
    <ConnectionContext.Provider value={contextValue}>
      {children}
    </ConnectionContext.Provider>
  );
};

export const useConnection = () => {
  const context = useContext(ConnectionContext);
  if (context === undefined) {
    throw new Error('useConnection must be used within a ConnectionProvider');
  }
  return context;
};