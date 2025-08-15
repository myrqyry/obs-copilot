// src/components/ConnectionProvider.tsx
import React, { createContext, useContext, useEffect, useMemo, useCallback } from 'react';
import { ObsClientImpl } from '@/services/obsClient';
import { StreamerBotService } from '@/services/streamerBotService';
import useConnectionsStore from '@/store/connectionsStore';
import { useAutomationStore } from '@/store/automationStore';
import { useChatStore } from '@/store/chatStore';
import { useSettingsStore } from '@/store/settingsStore';
import { toast } from '@/components/ui/toast';
import { loadConnectionSettings } from '@/utils/persistence';

// Define the shape of our context
interface ConnectionContextType {
    obsClient: ObsClientImpl;
    streamerBotService: StreamerBotService;
    handleObsConnect: (url: string, password?: string) => Promise<void>;
    handleStreamerBotConnect: (address: string, port: string) => Promise<void>;
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);

export const ConnectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // --- 1. Get Singleton Instances of Services ---
    const obsClient = useMemo(() => ObsClientImpl.getInstance(), []);
    const streamerBotService = useMemo(() => StreamerBotService.getInstance(), []);

    // --- 2. Get State and Actions from Zustand Stores ---
    // Note how each store is called according to its structure
    const { setObsServiceInstance, setConnected: setObsConnected } = useConnectionsStore();
    const { setStreamerBotServiceInstance } = useAutomationStore(state => state.actions);
    const { addMessage } = useChatStore(state => state.actions);
    const { obsWebSocketUrl, obsWebSocketPassword } = useSettingsStore();
    
    // --- 3. Define Connection Logic ---
    const handleObsConnect = useCallback(async (url: string, password?: string) => {
        if (!url.trim()) {
            toast({ title: 'OBS Connection', description: 'Please provide an OBS WebSocket URL.', variant: 'destructive' });
            return;
        }
        try {
            await obsClient.connect(url, password);
            setObsConnected(true);
            toast({ title: 'OBS Connection', description: 'Successfully connected to OBS!' });
        } catch (error: any) {
            setObsConnected(false);
            toast({ title: 'OBS Connection Failed', description: error.message, variant: 'destructive' });
        }
    }, [obsClient, setObsConnected]);
    
    const handleStreamerBotConnect = useCallback(async (address: string, port: string) => {
         if (!address.trim() || !port.trim()) {
            toast({ title: 'Streamer.bot Connection', description: 'Please provide both address and port.', variant: 'destructive' });
            return;
        }
        try {
            await streamerBotService.connect(address, parseInt(port, 10));
            setStreamerBotServiceInstance(streamerBotService); // This now works!
            addMessage({ role: 'system', text: '✅ Streamer.bot connection successful!' });
            toast({ title: 'Streamer.bot Connection', description: 'Successfully connected!' });
        } catch (error: any) {
             addMessage({ role: 'system', text: `⚠️ Streamer.bot connection failed: ${error.message}` });
            toast({ title: 'Streamer.bot Connection Failed', description: error.message, variant: 'destructive' });
        }
    }, [streamerBotService, addMessage, setStreamerBotServiceInstance]);

    // --- 4. Auto-Connect on App Load ---
    useEffect(() => {
        setObsServiceInstance(obsClient);
        setStreamerBotServiceInstance(streamerBotService);

        const savedSettings = loadConnectionSettings();
        if (savedSettings.autoConnect && savedSettings.obsWebSocketUrl) {
            handleObsConnect(savedSettings.obsWebSocketUrl, savedSettings.obsWebSocketPassword);
        }
        // We can add auto-connect for Streamer.bot here later if needed.

        // Define cleanup logic
        return () => {
            obsClient.disconnect();
            streamerBotService.disconnect();
        };
    }, [obsClient, streamerBotService, setObsServiceInstance, setStreamerBotServiceInstance, handleObsConnect]);

    // --- 5. Provide Context to Children ---
    const contextValue = useMemo(() => ({ 
        obsClient, 
        streamerBotService, 
        handleObsConnect,
        handleStreamerBotConnect
    }), [obsClient, streamerBotService, handleObsConnect, handleStreamerBotConnect]);

    return (
        <ConnectionContext.Provider value={contextValue}>
            {children}
        </ConnectionContext.Provider>
    );
};

export const useConnectionServices = () => {
    const context = useContext(ConnectionContext);
    if (context === undefined) {
        throw new Error('useConnectionServices must be used within a ConnectionProvider');
    }
    return context;
};