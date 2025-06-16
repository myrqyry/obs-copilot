import React, { useState, useEffect, useCallback, useRef } from 'react';
import OBSWebSocket, { EventSubscription } from 'obs-websocket-js';
// Import GSAP test for development verification
import './utils/gsapTest';
import { ConnectionPanel } from './components/ConnectionPanel';
import { ObsMainControls } from './components/ObsMainControls';
import { ObsSettingsPanel } from './components/ObsSettingsPanel';
import { GeminiChat } from './components/GeminiChat';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { Modal } from './components/common/Modal';
import {
    AppTab,
    OBSScene,
    OBSSource,
    catppuccinAccentColorsHexMap,
    catppuccinSecondaryAccentColorsHexMap,
    catppuccinChatBubbleColorsHexMap,
} from './types';
import { OBSWebSocketService } from './services/obsService';
import { useAppStore } from './store/appStore';
import { DEFAULT_OBS_WEBSOCKET_URL } from './constants';
import { AnimatedTitleLogos } from './components/common/AnimatedTitleLogos';
import { loadConnectionSettings, isStorageAvailable } from './utils/persistence';
import { gsap } from 'gsap';

const App: React.FC = () => {
    // Get state and actions directly from the comprehensive Zustand store - optimized selectors
    const isConnected = useAppStore(state => state.isConnected);
    const isConnecting = useAppStore(state => state.isConnecting);
    const connectError = useAppStore(state => state.connectError);
    const streamerName = useAppStore(state => state.streamerName);
    const obsServiceInstance = useAppStore(state => state.obsServiceInstance);
    const geminiMessages = useAppStore(state => state.geminiMessages);
    const geminiApiKey = useAppStore(state => state.geminiApiKey);
    const isGeminiClientInitialized = useAppStore(state => state.isGeminiClientInitialized);
    const geminiInitializationError = useAppStore(state => state.geminiInitializationError);
    const flipSides = useAppStore(state => state.flipSides);
    const theme = useAppStore(state => state.theme);
    const actions = useAppStore(state => state.actions);    // Local UI state (now much simpler!)
    const [obs, setObs] = useState<OBSWebSocket | null>(null);
    const [activeTab, setActiveTab] = useState<AppTab>(AppTab.GEMINI);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [geminiChatInput, setGeminiChatInput] = useState<string>('');

    const tabContentRef = useRef<HTMLDivElement>(null);
    const tabOrder: AppTab[] = [AppTab.GEMINI, AppTab.OBS_STUDIO, AppTab.SETTINGS, AppTab.CONNECTIONS];
    const headerRef = useRef<HTMLDivElement>(null);
    const [headerHeight, setHeaderHeight] = useState(64);

    useEffect(() => {
        if (headerRef.current) {
            setHeaderHeight(headerRef.current.offsetHeight);
        }
    }, []);

    // Update CSS custom properties when theme changes
    useEffect(() => {
        // Set legacy dynamic accent properties (for components not yet migrated)
        document.documentElement.style.setProperty('--dynamic-accent', catppuccinAccentColorsHexMap[theme.accent]);
        document.documentElement.style.setProperty('--dynamic-secondary-accent', catppuccinSecondaryAccentColorsHexMap[theme.secondaryAccent]);
        document.documentElement.style.setProperty('--user-chat-bubble-color', catppuccinChatBubbleColorsHexMap[theme.userChatBubble]);
        document.documentElement.style.setProperty('--model-chat-bubble-color', catppuccinChatBubbleColorsHexMap[theme.modelChatBubble]);

        // Update semantic design system variables to match selected accent colors
        const accentColor = catppuccinAccentColorsHexMap[theme.accent];
        // const secondaryAccentColor = catppuccinSecondaryAccentColorsHexMap[theme.secondaryAccent];

        // Convert hex to HSL for CSS custom properties
        const hexToHsl = (hex: string): string => {
            const r = parseInt(hex.slice(1, 3), 16) / 255;
            const g = parseInt(hex.slice(3, 5), 16) / 255;
            const b = parseInt(hex.slice(5, 7), 16) / 255;

            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            let h = 0, s = 0, l = (max + min) / 2;

            if (max !== min) {
                const d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

                switch (max) {
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                }
                h /= 6;
            }

            return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
        };

        // Update semantic variables with dynamic accent colors
        document.documentElement.style.setProperty('--primary', hexToHsl(accentColor));
        document.documentElement.style.setProperty('--ring', hexToHsl(accentColor));
    }, [theme.accent, theme.secondaryAccent, theme.userChatBubble, theme.modelChatBubble]);

    // Handle initial Gemini messages - removed geminiMessages from dependencies to prevent infinite loop
    useEffect(() => {
        const envApiKey = (process.env as any).VITE_GEMINI_API_KEY || (process.env as any).API_KEY;
        const effectiveApiKey = envApiKey || geminiApiKey;
        const hasInitialMessage = geminiMessages.some(m =>
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
                actions.addMessage({
                    role: 'system',
                    text: `Gemini Assistant initialized${streamer}. Ready for your commands! GLHF! ✨`,
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
    }, [isGeminiClientInitialized, geminiInitializationError, geminiApiKey, streamerName, isConnected]);

    // Define fetchData first
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

    // Your `handleConnect` and `handleDisconnect` functions now call actions from the store
    const handleConnect = useCallback(async (address: string, password?: string) => {
        actions.setConnecting();
        const newObs = new OBSWebSocket();
        try {
            await newObs.connect(address, password, {
                eventSubscriptions: EventSubscription.All
            });
            setObs(newObs);
            const newObsService = new OBSWebSocketService(newObs);
            actions.setObsServiceInstance(newObsService);

            // Fetch initial data after successful connection
            await fetchData(newObsService);
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
            actions.setObsServiceInstance(null);
        }
    }, [obs, actions]);

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

        // Run auto-connect after a brief delay to ensure all components are initialized
        const timeoutId = setTimeout(attemptAutoConnect, 500);
        return () => clearTimeout(timeoutId);
    }, [isConnected, isConnecting, obs, handleConnect]); // Run once after component mounts

    useEffect(() => {
        if (connectError) {
            setActiveTab(AppTab.CONNECTIONS);
        }
    }, [connectError]);

    useEffect(() => {
        if (isConnected && obs && obsServiceInstance) {
            fetchData();
            const onStateChanged = () => fetchData();

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
    }, [isConnected, obs, obsServiceInstance, fetchData]);

    useEffect(() => {
        if (tabContentRef.current) {
            // Smooth crossfade transition instead of slide
            gsap.fromTo(tabContentRef.current,
                { opacity: 0 },
                {
                    opacity: 1,
                    duration: 0.2,
                    ease: 'power2.out'
                }
            );
        }
    }, [activeTab]);

    const tabEmojis: Record<AppTab, string> = {
        [AppTab.CONNECTIONS]: '🔌',
        [AppTab.GEMINI]: '✨',
        [AppTab.OBS_STUDIO]: '🎬',
        [AppTab.SETTINGS]: '⚙️',
    };

    const handleSendToGeminiContext = useCallback((contextText: string) => {
        setGeminiChatInput(prevInput => `${contextText}${prevInput}`);
        setActiveTab(AppTab.GEMINI);
        setTimeout(() => document.getElementById('gemini-input')?.focus(), 0);
    }, []);

    const renderTabContent = () => {
        const envApiKey = (process.env as any).VITE_GEMINI_API_KEY || (process.env as any).API_KEY;

        return (
            <>
                {/* Connections Tab */}
                <div className={`h-full tab-content ${activeTab === AppTab.CONNECTIONS ? 'block' : 'hidden'}`}>
                    <div className="flex flex-col h-full bg-background border-l border-r border-b border-border rounded-b-lg shadow-lg">
                        <div className="flex-grow p-3 overflow-y-auto">
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
                            />
                        </div>
                    </div>
                </div>

                {/* OBS Studio Tab */}
                <div className={`h-full tab-content ${activeTab === AppTab.OBS_STUDIO ? 'block' : 'hidden'}`}>
                    <div className="flex flex-col h-full bg-background border-l border-r border-b border-border rounded-b-lg shadow-lg">
                        <div className="flex-grow p-3 overflow-y-auto">
                            {!isConnected || !obsServiceInstance ? (
                                <p className="text-center text-muted-foreground mt-8">
                                    <span className="emoji">🔗</span> Please connect to OBS WebSocket in the Connections tab to begin.
                                </p>
                            ) : (
                                <ObsMainControls
                                    obsService={obsServiceInstance!}
                                    onRefreshData={fetchData}
                                    setErrorMessage={setErrorMessage}
                                    onSendToGeminiContext={handleSendToGeminiContext}
                                    accentColorName={theme.accent}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Settings Tab */}
                <div className={`h-full tab-content ${activeTab === AppTab.SETTINGS ? 'block' : 'hidden'}`}>
                    <div className="flex flex-col h-full bg-background border-l border-r border-b border-border rounded-b-lg shadow-lg">
                        <div className="flex-grow p-3 overflow-y-auto">
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

                {/* Gemini Tab */}
                <div className={`h-full tab-content ${activeTab === AppTab.GEMINI ? 'block' : 'hidden'}`}>
                    <GeminiChat
                        geminiApiKeyFromInput={envApiKey || geminiApiKey}
                        obsService={obsServiceInstance!}
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
                        streamerName={streamerName}
                        flipSides={flipSides}
                        setFlipSides={actions.toggleFlipSides}
                    />
                </div>
            </>
        );
    };

    return (
        <div className="h-screen max-h-screen bg-gradient-to-br from-background to-card text-foreground flex flex-col overflow-hidden">
            <header ref={headerRef} className="sticky top-0 z-20 bg-background p-1 shadow-lg h-12 flex justify-center items-center">
                <AnimatedTitleLogos />
            </header>

            {/* Unified Header with Integrated Tabs */}
            <div
                className="sticky z-10 px-1 pt-1"
                style={{ top: `${headerHeight}px` }}
            >
                <div className="py-2 px-3 border-b border-border text-base font-semibold emoji-text bg-background rounded-t-lg font-sans text-primary shadow-lg border border-border">
                    <div className="flex items-center justify-center gap-1">
                        {/* Centered Tab navigation with expanding active tab */}
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
                                    case AppTab.GEMINI: return 'Gemini Assistant';
                                    case AppTab.OBS_STUDIO: return 'OBS Studio Controls';
                                    case AppTab.SETTINGS: return 'Settings & Preferences';
                                    case AppTab.CONNECTIONS: return 'Connection Manager';
                                    default: return tabName;
                                }
                            };

                            return (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`
                                        flex items-center gap-2 px-3 py-1.5 rounded-md font-medium
                                        transition-all duration-300 ease-out relative whitespace-nowrap
                                        ${isActive
                                            ? 'bg-primary/20 text-primary border border-primary/30 shadow-sm text-base'
                                            : 'hover:bg-muted/50 hover:text-foreground text-sm'
                                        }
                                    `}
                                >
                                    <span className={`${isActive ? 'text-base' : 'text-base'} ${iconColor} transition-colors duration-200`}>
                                        {tabEmojis[tab]}
                                    </span>
                                    <span className={`
                                        transition-all duration-300 overflow-hidden
                                        ${isActive ? 'max-w-48 opacity-100' : 'max-w-0 opacity-0'}
                                    `}>
                                        {getTabTitle(tab)}
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
                        <LoadingSpinner size={5} />
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
            </main>
        </div>
    );
};

export default App;
