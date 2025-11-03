import { StateCreator } from 'zustand';
import { StreamerBotService } from '@/services/streamerBotService';
import { StreamerBotError } from '@/types/streamerbot';
import { connectionManager } from '@/services/ConnectionManager';

export interface StreamerBotConnectionState {
  streamerBotServiceInstance: StreamerBotService | null;
  isStreamerBotConnected: boolean;
  streamerBotConnectionError: string | null;
  isStreamerBotLoading: boolean;
  connectToStreamerBot: (host: string, port: number) => Promise<void>;
  disconnectFromStreamerBot: () => Promise<void>;
}

export const createStreamerBotConnectionSlice: StateCreator<StreamerBotConnectionState, [], [], StreamerBotConnectionState> = (set) => {
  const streamerBotService = connectionManager.getStreamerBotConnection('default')!;

  const setupStreamerBotListeners = () => {
    streamerBotService.setLifecycleCallbacks({
      onConnect: () => {
        set({ isStreamerBotConnected: true, isStreamerBotLoading: false, streamerBotConnectionError: null });
      },
      onDisconnect: (code?: number, reason?: string) => {
        set({ isStreamerBotConnected: false, isStreamerBotLoading: false, streamerBotConnectionError: `Disconnected: ${reason || code}` });
      },
      onError: (err: StreamerBotError) => {
        set({ isStreamerBotConnected: false, isStreamerBotLoading: false, streamerBotConnectionError: err.message });
      },
    });
  };

  setupStreamerBotListeners();

  return {
    streamerBotServiceInstance: streamerBotService,
    isStreamerBotConnected: false,
    streamerBotConnectionError: null,
    isStreamerBotLoading: false,

    connectToStreamerBot: async (host: string, port: number) => {
      set({ isStreamerBotLoading: true, streamerBotConnectionError: null });
      try {
        await streamerBotService.connect(host, port);
      } catch (error: any) {
        set({ streamerBotConnectionError: error.message, isStreamerBotLoading: false, isStreamerBotConnected: false });
      }
    },

    disconnectFromStreamerBot: async () => {
      await streamerBotService.disconnect();
      set({
        isStreamerBotConnected: false,
        streamerBotConnectionError: null,
        isStreamerBotLoading: false,
      });
    },
  };
};