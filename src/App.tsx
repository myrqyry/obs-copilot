import config from './config';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import OBSWebSocket from 'obs-websocket-js';
if (import.meta.env.MODE === 'development') {
    // Import GSAP test for development verification
    import('./utils/gsapTest');
}
import { ConnectionPanel } from './components/ConnectionPanel';
import { ObsMainControls } from './components/ObsMainControls';
import { ObsSettingsPanel } from './components/ObsSettingsPanel';
import AdvancedPanel from './components/AdvancedPanel';
import { GeminiChat } from './components/GeminiChat';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { Modal } from './components/common/Modal';
import StreamingAssetsTab from './components/StreamingAssetsTab';
import CreateTab from './components/CreateTab';
import {
    AppTab,
    OBSScene,
    OBSSource,
    ChatMessage, // Add ChatMessage here
    catppuccinAccentColorsHexMap,
    catppuccinSecondaryAccentColorsHexMap,
    catppuccinChatBubbleColorsHexMap,
} from './types';
import { ObsClient, ObsClientImpl } from './services/ObsClient';
import { StreamerBotService } from './services/streamerBotService';
import { useAppStore, AppState } from './store/appStore'; // Import AppState
import { DEFAULT_OBS_WEBSOCKET_URL } from './constants';
import { AnimatedTitleLogos } from './components/common/AnimatedTitleLogos';
import { loadConnectionSettings, saveConnectionSettings, isStorageAvailable } from './utils/persistence';
import { useStreamerBotActions } from './hooks/useStreamerBotActions';
import { gsap } from 'gsap';
import MiniPlayer from './components/common/MiniPlayer';
import { debounce } from 'lodash';
import NotificationManager from './components/common/NotificationManager'; // Import NotificationManager

const App: React.FC = () => {
    // Music mini controller state (shared with CreateTab)
    
    // Get state and actions directly from the comprehensive Zustand store - optimized selectors
    const isConnected = useAppStore((state: AppState) => state.isConnected);
    const isConnecting = useAppStore((state: AppState) => state.isConnecting);
    const connectError = useAppStore((state: AppState) => state.connectError);
    const streamerName = useAppStore((state: AppState) => state.streamerName);
    const obsServiceInstance = useAppStore((state: AppState) => state.obsServiceInstance);
    const geminiMessages = useAppStore((state: AppState) => state.geminiMessages);
    const geminiApiKey = useAppStore((state: AppState) => state.geminiApiKey);
    const isGeminiClientInitialized = useAppStore((state: AppState) => state.isGeminiClientInitialized);
    const geminiInitializationError = useAppStore((state: AppState) => state.geminiInitializationError);
    const flipSides = useAppStore((state: AppState) => state.flipSides);
    const theme = useAppStore((state: AppState) => state.theme);
    const actions = useAppStore((state: AppState) => state.actions);    // Local UI state (now much simpler!)
    const [obs, setObs] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<AppTab>(AppTab.GEMINI);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [geminiChatInput, setGeminiChatInput] = useState<string>('');

    // Initialize StreamerBot settings from localStorage with defaults
    const persistedConnectionSettings = isStorageAvailable() ? loadConnectionSettings() : {};
    const [streamerBotAddress, setStreamerBotAddress] = useState<string>(
        persistedConnectionSettings.streamerBotAddress || 'localhost'
    );
    const [streamerBotPort, setStreamerBotPort] = useState<string>(
        persistedConnectionSettings.streamerBotPort || '8080'
    );
    const [isStreamerBotConnected, setIsStreamerBotConnected] = useState<boolean>(false);
    const [isStreamerBotConnecting, setIsStreamerBotConnecting] = useState<boolean>(false);

    const streamerBotService = useRef(new StreamerBotService()).current;

    const { handleStreamerBotAction } = useStreamerBotActions({
        streamerBotService,
        onAddMessage: actions.addMessage,
        setErrorMessage,
    });

    const tabContentRef = useRef<HTMLDivElement>(null);
    const tabOrder: AppTab[] = [AppTab.GEMINI, AppTab.OBS_STUDIO, AppTab.STREAMING_ASSETS, AppTab.CREATE, AppTab.SETTINGS, AppTab.CONNECTIONS, AppTab.ADVANCED];
    const headerRef = useRef<HTMLDivElement>(null);
    const [headerHeight, setHeaderHeight] = useState(64);

    const {
        extraDarkMode: extraDarkModeFromStore,
        bubbleFillOpacity,
        chatBubbleBlendMode,
        backgroundOpacity,
        chatBackgroundBlendMode
    } = useAppStore(state => state.userSettings);

    useEffect(() => {
        if (headerRef.current) {
            setHeaderHeight(headerRef.current.offsetHeight);
        }
    }, []);

    // Update CSS custom properties when theme changes
    useEffect(() => {
        // Set the data attribute for extra dark mode CSS selectors
        document.documentElement.setAttribute('data-extra-dark-mode', extraDarkModeFromStore.toString());

        // Adjust colors for extra dark mode
        const adjustForExtraDarkMode = (rgb: string): string => {
            if (!extraDarkModeFromStore) return rgb;
            const [r, g, b] = rgb.split(',').map(Number);
            return `${Math.max(r - 50, 0)}, ${Math.max(g - 50, 0)}, ${Math.max(b - 50, 0)}`;
        };

        // Set legacy dynamic accent properties (for components not yet migrated)
        document.documentElement.style.setProperty('--dynamic-accent', catppuccinAccentColorsHexMap[theme.accent]);
        document.documentElement.style.setProperty('--dynamic-secondary-accent', catppuccinSecondaryAccentColorsHexMap[theme.secondaryAccent]);
        document.documentElement.style.setProperty('--user-chat-bubble-color', catppuccinChatBubbleColorsHexMap[theme.userChatBubble]);
        document.documentElement.style.setProperty('--model-chat-bubble-color', catppuccinChatBubbleColorsHexMap[theme.modelChatBubble]);

        // Set theme colors as CSS variables for markdown effects
        document.documentElement.style.setProperty('--theme-accent', catppuccinAccentColorsHexMap[theme.accent]);
        document.documentElement.style.setProperty('--theme-secondary-accent', catppuccinSecondaryAccentColorsHexMap[theme.secondaryAccent]);
        document.documentElement.style.setProperty('--theme-user-bubble', catppuccinChatBubbleColorsHexMap[theme.userChatBubble]);
        document.documentElement.style.setProperty('--theme-model-bubble', catppuccinChatBubbleColorsHexMap[theme.modelChatBubble]);

        // Update RGB variables for chat bubble opacity
        const hexToRgb = (hex: string): string => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `${r}, ${g}, ${b}`;
        };

        document.documentElement.style.setProperty('--user-chat-bubble-color-rgb', adjustForExtraDarkMode(hexToRgb(catppuccinChatBubbleColorsHexMap[theme.userChatBubble])));
        document.documentElement.style.setProperty('--model-chat-bubble-color-rgb', adjustForExtraDarkMode(hexToRgb(catppuccinChatBubbleColorsHexMap[theme.modelChatBubble])));
        document.documentElement.style.setProperty('--dynamic-secondary-accent-rgb', adjustForExtraDarkMode(hexToRgb(catppuccinSecondaryAccentColorsHexMap[theme.secondaryAccent])));
    }, [theme.accent, theme.secondaryAccent, theme.userChatBubble, theme.modelChatBubble, extraDarkModeFromStore, bubbleFillOpacity, chatBubbleBlendMode, backgroundOpacity, chatBackgroundBlendMode]); // Added missing dependencies from the second block

    // const { extraDarkMode: extraDarkModeFromStore } = useAppStore((state: AppState) => state.userSettings); // This line was correctly commented out as it's defined above.
    // The second useEffect block starting from line 149 was a duplicate of the one starting on line 108 and has been removed.
    // The dependencies from the (removed) second block have been merged into the first one above.

    // Handle initial Gemini messages
    const geminiMessagesRef = useRef(geminiMessages);
    useEffect(() => {
        geminiMessagesRef.current = geminiMessages;
    }, [geminiMessages]);

    useEffect(() => {
        const envApiKey = config.GEMINI_API_KEY;
        const effectiveApiKey = envApiKey || geminiApiKey;
        const hasInitialMessage = geminiMessagesRef.current.some((m: ChatMessage) =>
            m.role === 'system' && (
                m.text.includes("Gemini Assistant initialized") ||
                m.text.includes("Gemini Assistant connected") ||
                m.text.includes("API Key must be configured") ||
                m.text.includes("Failed to initialize Gemini client")
            )
        );

        // Only show initial messages if no relevant system messages exist
        if (!hasInitialMessage) {
            if (geminiInitializationError) {
                actions.addMessage({ role: 'system', text: `❗ ${geminiInitializationError}` });
            } else if (isGeminiClientInitialized) {
                const streamer = streamerName ? `, **${streamerName}**` : '';
                const streamerBotStatus = isStreamerBotConnected ? ' Streamer.bot is also connected for enhanced automation!' : '';
                actions.addMessage({
                    role: 'system',
                    text: `Gemini Assistant initialized${streamer}. Ready for your commands! GLHF! ✨${streamerBotStatus}`,
                    showSuggestions: true
                });
            } else if (!effectiveApiKey && !isGeminiClientInitialized) {
                // Only show Gemini API Key warning if OBS is connected and Gemini API key is missing
                if (isConnected && !effectiveApiKey) {
                    actions.addMessage({ role: 'system', text: "Gemini API Key needs to be provided via environment variable (VITE_GEMINI_API_KEY) or manual input for Gemini features to work." });
                }
            }
        }
    }, [isGeminiClientInitialized, geminiInitializationError, geminiApiKey, streamerName, isConnected, isStreamerBotConnected]);

    // Define fetchData first with debouncing
const fetchData = useCallback(async () => {
    const serviceToUse = obsServiceInstance;
        if (!serviceToUse) return;

        try {
            const [
                scenesData,
                currentProgramSceneData,
                streamStatusData,
                recordStatusData,
                videoSettingsData,
                streamerUsernameData
            ] = await Promise.all([
                serviceToUse.getSceneList(),
                serviceToUse.getCurrentProgramScene(),
                serviceToUse.getStreamStatus(),
                serviceToUse.getRecordStatus(),
                serviceToUse.getVideoSettings(),
                serviceToUse.getStreamerUsername(),
            ]);

            let sources: OBSSource[] = [];
            if (currentProgramSceneData.currentProgramSceneName) {
                const sourcesData = await serviceToUse.getSceneItemList(currentProgramSceneData.currentProgramSceneName);
                sources = (sourcesData.sceneItems as unknown as OBSSource[]).map((item: any) => ({
                    sourceName: String(item.sourceName ?? ''),
                    sceneItemId: Number(item.sceneItemId ?? 0),
                    sceneItemEnabled: Boolean(item.sceneItemEnabled ?? false),
                    inputKind: String(item.inputKind ?? '')
                }));
            }

            const obsData = {
                scenes: (scenesData.scenes as unknown as OBSScene[]).map((s: any) => ({
                    sceneName: String(s.sceneName ?? ''),
                    sceneIndex: Number(s.sceneIndex ?? 0)
                })),
                currentProgramScene: currentProgramSceneData.currentProgramSceneName,
                sources: sources,
                streamStatus: streamStatusData,
                recordStatus: recordStatusData,
                videoSettings: videoSettingsData,
                streamerName: streamerUsernameData,
            };

            // Use the new comprehensive setConnected action
            actions.setConnected(obsData);
        } catch (error: any) {
            console.error("Error fetching OBS data:", error);
            setErrorMessage(`Error fetching OBS data: ${error.message}`);
            if (error.message?.toLowerCase().includes('not connected') || error.message?.toLowerCase().includes('connection closed')) {
                actions.setDisconnected('Connection to OBS lost. Please reconnect.');
                setActiveTab(AppTab.CONNECTIONS);
            }
        }
    }, [obsServiceInstance, actions]);

    // Debounced version of fetchData for event handlers
    const debouncedFetchData = useCallback(() => {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => fetchData(), { timeout: 500 });
        } else {
            setTimeout(() => fetchData(), 100);
        }
    }, [fetchData]);

    // Your `handleConnect` and `handleDisconnect` functions now call actions from the store
    const handleConnect = useCallback(async (address: string, password?: string) => {
        actions.setConnecting();
        // Fix: Support both ESM and CJS builds of obs-websocket-js
        let NewOBSWebSocket: any = OBSWebSocket;
        // If the import is an object with a .default property, use that
        if (OBSWebSocket && typeof OBSWebSocket === 'object' && 'default' in OBSWebSocket) {
            NewOBSWebSocket = (OBSWebSocket as any).default;
        }
        const newObs = new NewOBSWebSocket();
        try {
            // Per obs-websocket-js v5+ docs, use 0xFFFFFFFF to subscribe to all events
            await newObs.connect(address, password, {
                eventSubscriptions: 0xFFFFFFFF // Subscribe to all events
            });
            setObs(newObs);
const newObsService = new ObsClientImpl();
newObsService.obs = newObs;
            actions.setObsServiceInstance(newObsService);

            // Fetch initial data after successful connection
            await fetchData();

            // Attempt to connect to Streamer.bot if address and port are provided and not already connected
            const finalAddress = streamerBotAddress || 'localhost';
            const finalPort = streamerBotPort || '8080';
            console.log(`Streamer.bot connection check: address="${finalAddress}", port="${finalPort}", isConnected=${isStreamerBotConnected}, serviceConnected=${streamerBotService.isConnected()}`);
            
            if (finalAddress.trim() && finalPort.trim() && !isStreamerBotConnected && !streamerBotService.isConnected()) {
                try {
                    console.log('Attempting Streamer.bot connection after OBS connection...');
                    setIsStreamerBotConnecting(true);
                    await streamerBotService.connect(finalAddress, parseInt(finalPort, 10));
                    setIsStreamerBotConnected(true);
                    actions.addMessage({ role: 'system', text: '🤖✅ Streamer.bot connection successful! Enhanced automation features are now available.' });
                } catch (error: any) {
                    console.error('Streamer.bot connection failed:', error);
                    // Don't fail the entire OBS connection if Streamer.bot fails
                    actions.addMessage({ role: 'system', text: `⚠️ Streamer.bot connection failed: ${error.message}. OBS features will still work, but Streamer.bot actions won't be available.` });
                    setIsStreamerBotConnected(false);
                } finally {
                    setIsStreamerBotConnecting(false);
                }
            } else if (isStreamerBotConnected || streamerBotService.isConnected()) {
                console.log('Streamer.bot already connected, skipping connection attempt');
            } else {
                console.log('Streamer.bot connection skipped - missing address/port or already connected');
            }
        } catch (error: any) {
            console.error("Connection failed:", error);
            actions.setDisconnected(error.message || "Failed to connect to OBS WebSocket. Check address and password.");
            setObs(null);
        }
    }, [actions, fetchData]);

    const handleDisconnect = useCallback(async () => {
        if (obs) {
            await obs.disconnect();
            setObs(null);
            actions.setDisconnected();
            actions.setObsServiceInstance(null); // Clear OBS service instance
            if (isStreamerBotConnected) {
                streamerBotService.disconnect();
                setIsStreamerBotConnected(false);
                actions.addMessage({ role: 'system', text: '🤖 Streamer.bot disconnected.' });
            }
        }
    }, [obs, actions, isStreamerBotConnected, streamerBotService]);

    // Standalone Streamer.bot connection function
    const handleStreamerBotConnect = useCallback(async () => {
        const finalAddress = (streamerBotAddress || 'localhost').trim();
        const finalPort = (streamerBotPort || '8080').trim();

        if (!finalAddress || !finalPort) {
            actions.addMessage({ role: 'system', text: '⚠️ Please provide both Streamer.bot address and port.' });
            return;
        }

        // Check if already connected
        if (isStreamerBotConnected || streamerBotService.isConnected()) {
            actions.addMessage({ role: 'system', text: '🤖 Already connected to Streamer.bot.' });
            return;
        }

        // Check if connection is in progress
        if (streamerBotService.isConnectingToStreamerBot()) {
            actions.addMessage({ role: 'system', text: '🤖 Connection attempt already in progress. Please wait...' });
            return;
        }

        try {
            console.log('Initiating standalone Streamer.bot connection...');
            setIsStreamerBotConnecting(true);
            await streamerBotService.connect(finalAddress, parseInt(finalPort, 10));
            setIsStreamerBotConnected(true);
            actions.addMessage({ role: 'system', text: '✅ Streamer.bot connection successful! Enhanced automation features are now available.' });
        } catch (error: any) {
            console.error('Streamer.bot connection failed:', error);
            actions.addMessage({ role: 'system', text: `⚠️ Streamer.bot connection failed: ${error.message}. Please check the address and port, and make sure Streamer.bot is running with WebSocket enabled.` });
            setIsStreamerBotConnected(false);
        } finally {
            setIsStreamerBotConnecting(false);
        }
    }, [streamerBotAddress, streamerBotPort, streamerBotService, actions, isStreamerBotConnected]);
    const handleStreamerBotDisconnect = useCallback(() => {
        if (isStreamerBotConnected) {
            streamerBotService.disconnect();
            setIsStreamerBotConnected(false);
            actions.addMessage({ role: 'system', text: '🤖 Streamer.bot disconnected.' });
        }
    }, [isStreamerBotConnected, streamerBotService, actions]);

    // Enhanced StreamerBot settings handlers with persistence
    const handleStreamerBotAddressChange = useCallback((address: string) => {
        setStreamerBotAddress(address);
        if (isStorageAvailable()) {
            saveConnectionSettings({ streamerBotAddress: address });
        }
    }, []);

    const handleStreamerBotPortChange = useCallback((port: string) => {
        setStreamerBotPort(port);
        if (isStorageAvailable()) {
            saveConnectionSettings({ streamerBotPort: port });
        }
    }, []);

    // Auto-connect to OBS on app load if settings are saved and auto-connect is enabled
    useEffect(() => {
        const attemptAutoConnect = async () => {
            if (isConnected || isConnecting || obs) return; // Don't auto-connect if already connected/connecting

            if (isStorageAvailable()) {
                const connectionSettings = loadConnectionSettings();
                if (connectionSettings.autoConnect && connectionSettings.obsWebSocketUrl) {
                    console.log('Auto-connecting to OBS...', connectionSettings.obsWebSocketUrl);
                    try {
                        await handleConnect(connectionSettings.obsWebSocketUrl, connectionSettings.obsPassword);
                    } catch (error) {
                        console.warn('Auto-connect failed:', error);
                        // Don't show error message for auto-connect failures, just silently fail
                    }
                }
            }
        };

        // Use requestIdleCallback for better performance, fallback to setTimeout
        const scheduleAutoConnect = () => {
            if ('requestIdleCallback' in window) {
                requestIdleCallback(attemptAutoConnect, { timeout: 1000 });
            } else {
                // Fallback to setTimeout with shorter delay
                setTimeout(attemptAutoConnect, 100);
            }
        };

        scheduleAutoConnect();
    }, [isConnected, isConnecting, obs, handleConnect]); // Run once after component mounts

    useEffect(() => {
        if (connectError) {
            setActiveTab(AppTab.CONNECTIONS);
        }
    }, [connectError]);

    useEffect(() => {
        if (isConnected && obs && obsServiceInstance) {
            fetchData();
            const debouncedFetch = debounce(() => fetchData(), 300);

            // Group events by relevance
            const sceneEvents = ['CurrentProgramSceneChanged', 'SceneItemListReindexed'];
            const inputEvents = ['InputCreated', 'InputRemoved', 'InputSettingsChanged'];
            const volumeEvents = ['InputVolumeChanged', 'InputMuteStateChanged'];
            const filterEvents = ['SourceFilterCreated', 'SourceFilterRemoved', 'SourceFilterEnableStateChanged'];

            // Attach listeners
            sceneEvents.forEach(event => obs.on(event, debouncedFetch));
            inputEvents.forEach(event => obs.on(event, debouncedFetch));
            volumeEvents.forEach(event => obs.on(event, debouncedFetch));
            filterEvents.forEach(event => obs.on(event, debouncedFetch));
            obs.on('StreamStateChanged', debouncedFetch);
            obs.on('RecordStateChanged', debouncedFetch);
            obs.on('VideoSettingsChanged', debouncedFetch);

            return () => {
                // Detach listeners
                sceneEvents.forEach(event => obs.off(event, debouncedFetch));
                inputEvents.forEach(event => obs.off(event, debouncedFetch));
                volumeEvents.forEach(event => obs.off(event, debouncedFetch));
                filterEvents.forEach(event => obs.off(event, debouncedFetch));
                obs.off('StreamStateChanged', debouncedFetch);
                obs.off('RecordStateChanged', debouncedFetch);
                obs.off('VideoSettingsChanged', debouncedFetch);
            };
        }
    }, [isConnected, obs, obsServiceInstance, fetchData, debouncedFetchData]);

    useEffect(() => {
        if (tabContentRef.current) {
            // Smooth crossfade transition instead of slide
            gsap.fromTo(
                tabContentRef.current,
                { opacity: 0 },
                {
                    opacity: 1,
                    duration: 0.2,
                    ease: 'power2.out',
                    onComplete: () => {
                        // Ensure opacity is set to 1 after animation
                        if (tabContentRef.current) {
                            tabContentRef.current.style.opacity = '1';
                        }
                    },
                }
            );
        } else {
            console.warn('tabContentRef is null during animation');
        }
    }, [activeTab]);

    const tabEmojis: Record<AppTab, string> = {
        [AppTab.GEMINI]: '🤖',
        [AppTab.OBS_STUDIO]: '🎬',
        [AppTab.STREAMING_ASSETS]: '🌈',
        [AppTab.CREATE]: '✨',
        [AppTab.SETTINGS]: '⚙️',
        [AppTab.CONNECTIONS]: '🔌',
        [AppTab.ADVANCED]: '🛠️',
    };

    const renderTabContent = () => {
        const envApiKey = (process.env as any).VITE_GEMINI_API_KEY || (process.env as any).API_KEY;

        switch (activeTab) {
            case AppTab.CONNECTIONS:
                return (
                    <ConnectionPanel
                        onConnect={handleConnect}
                        onDisconnect={handleDisconnect}
                        isConnected={isConnected}
                        isConnecting={isConnecting}
                        defaultUrl={DEFAULT_OBS_WEBSOCKET_URL}
                        error={connectError}
                        geminiApiKey={geminiApiKey}
                        envGeminiApiKey={envApiKey}
                        onGeminiApiKeyChange={actions.setGeminiApiKey}
                        isGeminiClientInitialized={isGeminiClientInitialized}
                        geminiInitializationError={geminiInitializationError}
                        accentColorName={theme.accent}
                        streamerBotAddress={streamerBotAddress}
                        setStreamerBotAddress={handleStreamerBotAddressChange}
                        streamerBotPort={streamerBotPort}
                        setStreamerBotPort={handleStreamerBotPortChange}
                        onStreamerBotConnect={handleStreamerBotConnect}
                        onStreamerBotDisconnect={handleStreamerBotDisconnect}
                        isStreamerBotConnected={isStreamerBotConnected}
                        isStreamerBotConnecting={isStreamerBotConnecting}
                    />
                );
            case AppTab.OBS_STUDIO:
                return (
                    <>
                        {!isConnected || !obsServiceInstance ? (
                            <p className="text-center text-muted-foreground mt-6">
                                <span className="emoji">🔗</span> Please connect to OBS WebSocket in the Connections tab to begin.
                            </p>
                        ) : (
                            <ObsMainControls
                                obsService={obsServiceInstance}
                                onRefreshData={fetchData}
                                setErrorMessage={setErrorMessage}
                                accentColorName={theme.accent}
                            />
                        )}
                    </>
                );
            case AppTab.STREAMING_ASSETS:
                return <StreamingAssetsTab />;
            case AppTab.CREATE:
                return <CreateTab />;
            case AppTab.SETTINGS:
                return (
                    <ObsSettingsPanel
                        selectedAccentColorName={theme.accent}
                        selectedSecondaryAccentColorName={theme.secondaryAccent}
                        selectedUserChatBubbleColorName={theme.userChatBubble}
                        selectedModelChatBubbleColorName={theme.modelChatBubble}
                        flipSides={flipSides}
                        actions={actions}
                    />
                );
            case AppTab.ADVANCED:
                return <AdvancedPanel />;
            case AppTab.GEMINI:
                return (
                    <GeminiChat
                        geminiApiKeyFromInput={envApiKey || geminiApiKey}
                        streamerBotService={streamerBotService}
                        onRefreshData={fetchData}
                        setErrorMessage={setErrorMessage}
                        chatInputValue={geminiChatInput}
                        onChatInputChange={setGeminiChatInput}
                        accentColorName={theme.accent}
                        messages={geminiMessages}
                        onAddMessage={actions.addMessage}
                        isGeminiClientInitialized={isGeminiClientInitialized}
                        geminiInitializationError={geminiInitializationError}
                        onSetIsGeminiClientInitialized={actions.setGeminiClientInitialized}
                        onSetGeminiInitializationError={actions.setGeminiInitializationError}
                        activeTab={activeTab}
                        onStreamerBotAction={handleStreamerBotAction}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="h-screen max-h-screen bg-gradient-to-br from-background to-card text-foreground flex flex-col overflow-hidden">
            <header ref={headerRef} className="sticky top-0 z-20 bg-background p-2 shadow-md h-12 flex justify-center items-center">
                <AnimatedTitleLogos />
            </header>

            {/* Unified Header with Integrated Tabs */}
            <div
                className="sticky z-10 px-2 pt-2"
                style={{ top: `${headerHeight}px` }}
            >
                <div role="tablist" aria-label="Main application tabs" className="py-2 px-4 border-b border-border text-sm font-semibold emoji-text bg-background rounded-t-lg font-sans text-primary shadow-md">
                    <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2 min-w-0">
                        {tabOrder.map((tab, index) => {
                            const isActive = activeTab === tab;

                            // Define connection status color for the connections tab icon
                            let iconColor = 'text-muted-foreground';
                            const isConnectionsTab = tab === AppTab.CONNECTIONS;
                            if (isConnectionsTab) {
                                if (isConnecting) {
                                    iconColor = 'text-yellow-500';
                                } else if (isConnected && isGeminiClientInitialized) {
                                    iconColor = 'text-green-500';
                                } else if (isConnected) {
                                    iconColor = 'text-blue-500';
                                } else {
                                    iconColor = 'text-destructive';
                                }
                            } else if (isActive) {
                                iconColor = 'text-primary';
                            } else {
                                iconColor = 'text-muted-foreground';
                            }

                            // Get the full title for the active tab
                            const getTabTitle = (tabName: AppTab) => {
                                switch (tabName) {
                                    case AppTab.GEMINI: return 'Assistant';
                                    case AppTab.OBS_STUDIO: return 'OBS Controls';
                                    case AppTab.STREAMING_ASSETS: return 'Assets';
                                    case AppTab.CREATE: return 'Create';
                                    case AppTab.SETTINGS: return 'Settings';
                                    case AppTab.CONNECTIONS: return 'Connections';
                                    case AppTab.ADVANCED: return 'Advanced';
                                    default: return tabName;
                                }
                            };

                            // Get shorter titles for mobile - icons only on xs screens
                            const getMobileTabTitle = (tabName: AppTab) => {
                                // On 'xs' screens, we'll only show icons, so this won't be visible.
                                // For 'sm' and up, we show a slightly shorter title if active.
                                if (isActive) {
                                    switch (tabName) {
                                        case AppTab.OBS_STUDIO: return 'OBS';
                                        case AppTab.STREAMING_ASSETS: return 'Assets';
                                        case AppTab.CONNECTIONS: return 'Connect';
                                        default: return getTabTitle(tabName);
                                    }
                                }
                                return getTabTitle(tabName);
                            };

                            return (
                                <button
                                    key={tab}
                                    role="tab"
                                    aria-selected={isActive.toString()}
                                    aria-controls={`tabpanel-${tab}`} // Assuming tab panels will have corresponding IDs
                                    id={`tab-${tab}`}
                                    onClick={() => setActiveTab(tab)}
                                    onKeyDown={(e) => {
                                        let nextIndex = index;
                                        if (e.key === 'ArrowRight') {
                                            nextIndex = (index + 1) % tabOrder.length;
                                        } else if (e.key === 'ArrowLeft') {
                                            nextIndex = (index - 1 + tabOrder.length) % tabOrder.length;
                                        } else if (e.key === 'Home') {
                                            nextIndex = 0;
                                        } else if (e.key === 'End') {
                                            nextIndex = tabOrder.length - 1;
                                        } else {
                                            return; // Not an arrow, home, or end key
                                        }
                                        e.preventDefault();
                                        const nextTabButton = document.getElementById(`tab-${tabOrder[nextIndex]}`);
                                        nextTabButton?.focus();
                                        setActiveTab(tabOrder[nextIndex]); // Optionally activate on arrow navigation
                                    }}
                                    className={`
                                        flex items-center gap-1 xs:gap-0 sm:gap-1 px-2 xs:px-1.5 sm:px-3 py-1.5 sm:py-2 rounded-md font-medium
                                        transition-all duration-300 ease-out relative whitespace-nowrap
                                        hover:bg-muted/50 hover:text-foreground
                                        focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 focus:ring-offset-background
                                        ${isActive
                                            ? 'bg-primary/20 text-primary border border-primary/30 shadow-sm text-xs sm:text-sm'
                                            : 'text-muted-foreground text-xs sm:text-sm'
                                        }
                                    `}
                                    title={getTabTitle(tab)} // Tooltip for all screen sizes
                                >
                                    <span className={`text-sm xs:text-base sm:text-lg ${iconColor} transition-colors duration-200`}>
                                        {tabEmojis[tab]}
                                    </span>
                                    {/* Text is hidden on xs, visible and truncated on sm+, full on md+ or when active */}
                                    <span className={`
                                        transition-all duration-300 overflow-hidden
                                        hidden xs:inline-block
                                        ${isActive ? 'max-w-xs sm:max-w-sm md:max-w-md opacity-100 ml-1 sm:ml-1.5' : 'max-w-0 opacity-0 sm:opacity-100 sm:max-w-[50px] md:max-w-[70px] sm:ml-1'}
                                    `}>
                                        <span className="hidden xs:inline sm:hidden">{isActive ? getMobileTabTitle(tab) : ''}</span>
                                        <span className="hidden sm:inline">{getMobileTabTitle(tab)}</span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <main className="flex-grow overflow-y-auto px-1 sm:px-2 pb-1">
                {isConnecting && !isConnected && (
                    <div className="flex justify-center items-center mt-1 text-orange-500 p-2">
                        <LoadingSpinner size={4} />
                        <span className="ml-2 text-sm">Connecting to OBS...</span>
                    </div>
                )}

                {errorMessage && (
                    <Modal title="❗ Application Error" onClose={() => setErrorMessage(null)} accentColorName={theme.accent}>
                        <p>{errorMessage}</p>
                    </Modal>
                )}

                <div
                    ref={tabContentRef}
                    id={`tabpanel-${activeTab}`}
                    role="tabpanel"
                    aria-labelledby={`tab-${activeTab}`}
                    className="flex-grow flex flex-col min-h-0 h-full tab-content-container tab-transition focus:outline-none" // Added focus:outline-none for programmatic focus if needed
                    tabIndex={-1} // Make it programmatically focusable if needed for some ARIA patterns
                >
                    {renderTabContent()}
                </div>
                {/* Unified mini player, always available if music or TTS is playing */}
                <MiniPlayer />
            </main>
            {/* The tab content should ideally have role="tabpanel" and an id that matches aria-controls */}
            {/* Example: <div id={`tabpanel-${activeTab}`} role="tabpanel" ... > */}
            <NotificationManager /> {/* Add NotificationManager here */}
        </div>
    );
};

export default App;
