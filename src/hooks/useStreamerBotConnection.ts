import { useState, useCallback } from 'react';
import { StreamerBotService } from '../services/streamerBotService';
import { useChatStore } from '../store/chatStore';
import { useAutomationStore } from '../store/automationStore';

export const useStreamerBotConnection = (streamerBotService: StreamerBotService) => {
    const [isStreamerBotConnected, setIsStreamerBotConnected] = useState<boolean>(false);
    const [isStreamerBotConnecting, setIsStreamerBotConnecting] = useState<boolean>(false);
    const { addMessage } = useChatStore(state => state.actions);
    const { setStreamerBotServiceInstance } = useAutomationStore(state => state.actions);

    const handleStreamerBotConnect = useCallback(async (address: string, port: string) => {
        if (!address.trim() || !port.trim()) {
            addMessage({ role: 'system', text: '⚠️ Please provide both Streamer.bot address and port.' });
            return;
        }

        if (isStreamerBotConnected || streamerBotService.isConnected()) {
            addMessage({ role: 'system', text: '🤖 Already connected to Streamer.bot.' });
            return;
        }

        setIsStreamerBotConnecting(true);
        try {
            await streamerBotService.connect(address, parseInt(port, 10));
            setIsStreamerBotConnected(true);
            setStreamerBotServiceInstance(streamerBotService);
            addMessage({ role: 'system', text: '✅ Streamer.bot connection successful!' });
        } catch (error: any) {
            addMessage({ role: 'system', text: `⚠️ Streamer.bot connection failed: ${error.message}.` });
            setIsStreamerBotConnected(false);
        } finally {
            setIsStreamerBotConnecting(false);
        }
    }, [isStreamerBotConnected, streamerBotService, addMessage, setStreamerBotServiceInstance]);

    const handleStreamerBotDisconnect = useCallback(() => {
        if (isStreamerBotConnected) {
            streamerBotService.disconnect();
            setIsStreamerBotConnected(false);
            setStreamerBotServiceInstance(null);
            addMessage({ role: 'system', text: '🤖 Streamer.bot disconnected.' });
        }
    }, [isStreamerBotConnected, streamerBotService, addMessage, setStreamerBotServiceInstance]);

    return {
        isStreamerBotConnected,
        isStreamerBotConnecting,
        handleStreamerBotConnect,
        handleStreamerBotDisconnect,
    };
};
