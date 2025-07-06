import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import OBSWebSocket from 'obs-websocket-js';
// Import GSAP test for development verification
import './utils/gsapTest';
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
import { OBSWebSocketService } from './services/obsService';
import { StreamerBotService } from './services/streamerBotService';
import { useAppStore, AppState } from './store/appStore'; // Import AppState
import { DEFAULT_OBS_WEBSOCKET_URL } from './constants';
import { AnimatedTitleLogos } from './components/common/AnimatedTitleLogos';
import { loadConnectionSettings, saveConnectionSettings, isStorageAvailable } from './utils/persistence';
import { useStreamerBotActions } from './hooks/useStreamerBotActions';
import { gsap } from 'gsap';
import MiniPlayer from './components/common/MiniPlayer';

const App: React.FC = () => {
    // Music mini controller state (shared with CreateTab)
    // Removed unused musicAudioUrl, handleMusicPause, handleMusicResume, handleMusicStop

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

    const { extraDarkMode } = useAppStore();

    useEffect(() => {
        if (headerRef.current) {
            setHeaderHeight(headerRef.current.offsetHeight);
        }
    }, []);

    // Update CSS custom properties when theme changes
    useEffect(() => {
        // Set the data attribute for extra dark mode CSS selectors
        document.documentElement.setAttribute('data-extra-dark-mode', extraDarkMode.toString());

        // Adjust colors for extra dark mode
        const adjustForExtraDarkMode = (rgb: string): string => {
            if (!extraDarkMode) return rgb;
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
    }, [theme.accent, theme.secondaryAccent, theme.userChatBubble, theme.modelChatBubble, extraDarkMode]);

    const { extraDarkMode: extraDarkModeFromStore } = useAppStore((state: AppState) => state.userSettings);

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
    }, [theme.accent, theme.secondaryAccent, theme.userChatBubble, theme.modelChatBubble, extraDarkModeFromStore]);

    // Handle initial Gemini messages - removed geminiMessages from dependencies to prevent infinite loop
    useEffect(() => {
        const envApiKey = (process.env as any).VITE_GEMINI_API_KEY || (process.env as any).API_KEY;
        const effectiveApiKey = envApiKey || geminiApiKey;
        const hasInitialMessage = geminiMessages.some((m: ChatMessage) =>
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isGeminiClientInitialized, geminiInitializationError, geminiApiKey, streamerName, isConnected, isStreamerBotConnected]);

    // Define fetchData first with debouncing
    const fetchData = useCallback(async (obsService?: OBSWebSocketService) => {
        const serviceToUse = obsService || obsServiceInstance;
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
            const newObsService = new OBSWebSocketService(newObs);
            actions.setObsServiceInstance(newObsService);

            // Fetch initial data after successful connection
            await fetchData(newObsService); // Pass the newObsService instance

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
            const onStateChanged = () => debouncedFetchData();

            obs.on('CurrentProgramSceneChanged', onStateChanged);
            obs.on('StreamStateChanged', onStateChanged);
            obs.on('RecordStateChanged', onStateChanged);
            obs.on('SceneItemListReindexed', onStateChanged);
            obs.on('SceneItemCreated', onStateChanged);
            obs.on('SceneItemRemoved', onStateChanged);
            obs.on('SceneItemEnableStateChanged', onStateChanged);
            obs.on('SceneItemTransformChanged', onStateChanged);
            obs.on('InputCreated', onStateChanged);
            obs.on('InputRemoved', onStateChanged);
            obs.on('InputSettingsChanged', onStateChanged);
            obs.on('InputVolumeChanged', onStateChanged);
            obs.on('InputMuteStateChanged', onStateChanged);
            obs.on('SourceFilterCreated', onStateChanged);
            obs.on('SourceFilterRemoved', onStateChanged);
            obs.on('SourceFilterEnableStateChanged', onStateChanged);
            obs.on('VideoSettingsChanged' as any, onStateChanged);

            return () => {
                obs.off('CurrentProgramSceneChanged', onStateChanged);
                obs.off('StreamStateChanged', onStateChanged);
                obs.off('RecordStateChanged', onStateChanged);
                obs.off('SceneItemListReindexed', onStateChanged);
                obs.off('SceneItemCreated', onStateChanged);
                obs.off('SceneItemRemoved', onStateChanged);
                obs.off('SceneItemEnableStateChanged', onStateChanged);
                obs.off('SceneItemTransformChanged', onStateChanged);
                obs.off('InputCreated', onStateChanged);
                obs.off('InputRemoved', onStateChanged);
                obs.off('InputSettingsChanged', onStateChanged);
                obs.off('InputVolumeChanged', onStateChanged);
                obs.off('InputMuteStateChanged', onStateChanged);
                obs.off('SourceFilterCreated', onStateChanged);
                obs.off('SourceFilterRemoved', onStateChanged);
                obs.off('SourceFilterEnableStateChanged', onStateChanged);
                obs.off('VideoSettingsChanged' as any, onStateChanged);
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

        return (
            <>
                {/* Connections Tab */}
                <div className={`h-full tab-content ${activeTab === AppTab.CONNECTIONS ? 'block' : 'hidden'}`}>
                    <div className="flex flex-col h-full bg-background border-l border-r border-b border-border rounded-b-lg shadow-lg">
                        <div className="flex-grow p-1 overflow-y-auto">
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
                        </div>
                    </div>
                </div>

                {/* OBS Studio Tab */}
                <div className={`h-full tab-content ${activeTab === AppTab.OBS_STUDIO ? 'block' : 'hidden'}`}>
                    <div className="flex flex-col h-full bg-background border-l border-r border-b border-border rounded-b-lg shadow-lg">
                        <div className="flex-grow p-1 overflow-y-auto">
                            {!isConnected || !obsServiceInstance ? (
                                <p className="text-center text-muted-foreground mt-6">
                                    <span className="emoji">🔗</span> Please connect to OBS WebSocket in the Connections tab to begin.
                                </p>
                            ) : (
                                <ObsMainControls
                                    obsService={obsServiceInstance!}
                                    onRefreshData={fetchData}
                                    setErrorMessage={setErrorMessage}
                                    accentColorName={theme.accent}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Streaming Assets Tab */}
                <div className={`h-full tab-content ${activeTab === AppTab.STREAMING_ASSETS ? 'block' : 'hidden'}`}>
                    <div className="flex flex-col h-full bg-background border-l border-r border-b border-border rounded-b-lg shadow-lg">
                        <div className="flex-grow p-1 overflow-y-auto">
                            <StreamingAssetsTab />
                        </div>
                    </div>
                </div>

                {/* Create Tab */}
                <div className={`h-full tab-content ${activeTab === AppTab.CREATE ? 'block' : 'hidden'}`}>
                    <div className="flex flex-col h-full bg-background border-l border-r border-b border-border rounded-b-lg shadow-lg">
                        <div className="flex-grow p-1 overflow-y-auto">
                            <CreateTab />
                        </div>
                    </div>
                </div>

                {/* Settings Tab */}
                <div className={`h-full tab-content ${activeTab === AppTab.SETTINGS ? 'block' : 'hidden'}`}>
                    <div className="flex flex-col h-full bg-background border-l border-r border-b border-border rounded-b-lg shadow-lg">
                        <div className="flex-grow p-1 overflow-y-auto">
                            <ObsSettingsPanel
                                selectedAccentColorName={theme.accent}
                                selectedSecondaryAccentColorName={theme.secondaryAccent}
                                selectedUserChatBubbleColorName={theme.userChatBubble}
                                selectedModelChatBubbleColorName={theme.modelChatBubble}
                                flipSides={flipSides}
                                actions={actions}
                            />
                        </div>
                    </div>
                </div>

                {/* Advanced Tab */}
                <div className={`h-full tab-content ${activeTab === AppTab.ADVANCED ? 'block' : 'hidden'}`}>
                    <div className="flex flex-col h-full bg-background border-l border-r border-b border-border rounded-b-lg shadow-lg">
                        <div className="flex-grow p-1 overflow-y-auto">
                            <AdvancedPanel />
                        </div>
                    </div>
                </div>

                {/* Gemini Tab */}
                <div className={`h-full tab-content ${activeTab === AppTab.GEMINI ? 'block' : 'hidden'}`}>
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
                </div>
            </>
        );
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
                <div className="py-2 px-4 border-b border-border text-sm font-semibold emoji-text bg-background rounded-t-lg font-sans text-primary shadow-md">
                    <div className="flex items-center justify-center gap-2 min-w-0">
                        {tabOrder.map((tab) => {
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
                                    case AppTab.OBS_STUDIO: return 'OBS Studio Controls';
                                    case AppTab.STREAMING_ASSETS: return 'Streaming Assets';
                                    case AppTab.CREATE: return 'Create';
                                    case AppTab.SETTINGS: return 'Settings & Preferences';
                                    case AppTab.CONNECTIONS: return 'Connection Manager';
                                    case AppTab.ADVANCED: return 'Advanced';
                                    default: return tabName;
                                }
                            };

                            // Get shorter titles for mobile
                            const getMobileTabTitle = (tabName: AppTab) => {
                                switch (tabName) {
                                    case AppTab.GEMINI: return 'Assistant';
                                    case AppTab.OBS_STUDIO: return 'OBS Studio';
                                    case AppTab.STREAMING_ASSETS: return 'Assets';
                                    case AppTab.CREATE: return 'Create';
                                    case AppTab.SETTINGS: return 'Settings';
                                    case AppTab.CONNECTIONS: return 'Connect';
                                    case AppTab.ADVANCED: return 'Advanced';
                                    default: return tabName;
                                }
                            };

                            return (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`
                                        flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-md font-medium
                                        transition-all duration-300 ease-out relative whitespace-nowrap
                                        ${isActive
                                            ? 'bg-primary/20 text-primary border border-primary/30 shadow-sm text-sm'
                                            : 'hover:bg-muted/50 hover:text-foreground text-sm'
                                        }
                                    `}
                                >
                                    <span className={`${isActive ? 'text-base' : 'text-base'} ${iconColor} transition-colors duration-200`}>
                                        {tabEmojis[tab]}
                                    </span>
                                    <span className={`
                                        transition-all duration-300 overflow-hidden text-sm sm:text-base
                                        ${isActive ? 'max-w-32 sm:max-w-48 opacity-100' : 'max-w-0 opacity-0'}
                                    `}>
                                        <span className="hidden sm:inline">{getTabTitle(tab)}</span>
                                        <span className="inline sm:hidden">{getMobileTabTitle(tab)}</span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <main className="flex-grow overflow-y-auto px-1 pb-1">
                {isConnecting && !isConnected && (
                    <div className="flex justify-center items-center mt-1 text-orange-500">
                        <LoadingSpinner size={4} />
                        <span className="ml-2 text-sm">Connecting to OBS...</span>
                    </div>
                )}

                {errorMessage && (
                    <Modal title="❗ Application Error" onClose={() => setErrorMessage(null)} accentColorName={theme.accent}>
                        <p>{errorMessage}</p>
                    </Modal>
                )}

                <div ref={tabContentRef} className="flex-grow flex flex-col min-h-0 h-full tab-content-container tab-transition">
                    {renderTabContent()}
                </div>
                {/* Unified mini player, always available if music or TTS is playing */}
                <MiniPlayer />
            </main>
        </div>
    );
};

export default App;
