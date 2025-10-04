// src/features/connections/ConnectionProvider.tsx
import React, { createContext, useEffect, useMemo, useCallback, useState } from 'react';
import { ObsClientImpl } from '@/services/obsClient';
import { StreamerBotService } from '@/services/streamerBotService';
import useConnectionsStore from '@/store/connectionsStore';
import useStreamerbotStore from '@/store/streamerbotStore';
import { useAutomationStore } from '@/store/automationStore';
import { useChatStore } from '@/store/chatStore';
import { toast } from '@/components/ui/toast';
import { loadConnectionSettings, saveConnectionSettings } from '@/utils/persistence';
import ErrorViewer from '@/components/ui/ErrorViewer';
import useUiStore from '@/store/uiStore';

// Define the shape of our context
interface ConnectionContextType {
    obsClient: ObsClientImpl;
    streamerBotService: StreamerBotService;
    handleObsConnect: (url: string, password?: string) => Promise<void>;
    handleStreamerBotConnect: (address: string, port: string) => Promise<void>;
}

export const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);

export const ConnectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // --- 1. Get Singleton Instances of Services ---
    const obsClient = useMemo(() => ObsClientImpl.getInstance(), []);
    const streamerBotService = useMemo(() => StreamerBotService.getInstance(), []);

    // --- 2. Get State and Actions from Zustand Stores ---
    // Note how each store is called according to its structure
    const { connectToObs, disconnectFromObs } = useConnectionsStore();
    const { streamerBotHost, streamerBotPort } = useStreamerbotStore();
    const { setStreamerBotServiceInstance } = useAutomationStore(state => state.actions);
    const { addMessage } = useChatStore(state => state.actions);

    const { criticalErrors } = useUiStore();
    const [isErrorViewerOpen, setIsErrorViewerOpen] = useState(false);
    
    // Auto-open ErrorViewer if there are critical errors
    useEffect(() => {
      if (criticalErrors.length > 0 && !isErrorViewerOpen) {
        setIsErrorViewerOpen(true);
      }
    }, [criticalErrors.length, isErrorViewerOpen]);
    
    // --- 3. Define Connection Logic ---
    const handleObsConnect = useCallback(async (url: string, password?: string) => {
        if (!url.trim()) {
            toast({ title: 'OBS Connection', description: 'Please provide an OBS WebSocket URL.', variant: 'destructive' });
            return;
        }
        try {
            await connectToObs(url, password); // Use the store's connectToObs
            toast({ title: 'OBS Connection', description: 'Successfully connected to OBS!' });
        } catch (error: any) {
            // The error is now handled by the store, so we just log it here if needed
            console.error('OBS Connection Failed:', error);
            toast({ title: 'OBS Connection Failed', description: 'Failed to connect. Please check the URL and password.', variant: 'destructive' });
        }
    }, [connectToObs]);
    
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
        // Clear the invalid URL from local storage on first load
        const savedSettings = loadConnectionSettings();
        if (savedSettings.obsUrl === 'myrqyry') {
            saveConnectionSettings({ obsUrl: '' });
        }
        
        setStreamerBotServiceInstance(streamerBotService);

        if (savedSettings.autoConnect && savedSettings.obsUrl) { // Use obsUrl
            connectToObs(savedSettings.obsUrl, savedSettings.obsPassword); // Use obsUrl and obsPassword
        }

        if (streamerBotHost && streamerBotPort) {
            handleStreamerBotConnect(streamerBotHost, streamerBotPort);
        }

        // Define cleanup logic
        return () => {
            disconnectFromObs(); // Use the store's disconnectFromObs
            streamerBotService.disconnect();
        };
    }, [streamerBotService, setStreamerBotServiceInstance, connectToObs, disconnectFromObs, handleStreamerBotConnect, streamerBotHost, streamerBotPort]);

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
            <ErrorViewer
              isOpen={isErrorViewerOpen}
              onClose={() => setIsErrorViewerOpen(false)}
            />
        </ConnectionContext.Provider>
    );
};
