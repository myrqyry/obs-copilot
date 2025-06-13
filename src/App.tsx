import React, { useState, useEffect, useCallback, useRef } from 'react';
import { gsap } from 'gsap';
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
        document.documentElement.style.setProperty('--dynamic-accent', catppuccinAccentColorsHexMap[theme.accent]);
        document.documentElement.style.setProperty('--dynamic-secondary-accent', catppuccinSecondaryAccentColorsHexMap[theme.secondaryAccent]);
        document.documentElement.style.setProperty('--user-chat-bubble-color', catppuccinChatBubbleColorsHexMap[theme.userChatBubble]);
        document.documentElement.style.setProperty('--model-chat-bubble-color', catppuccinChatBubbleColorsHexMap[theme.modelChatBubble]);
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
                // Only show Gemini API Key warning if OBS is connected but Gemini API key is missing
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
            gsap.fromTo(
                tabContentRef.current,
                { opacity: 0, y: 10 },
                { opacity: 1, y: 0, duration: 0.3, ease: 'power2.inOut' }
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

        switch (activeTab) {
            case AppTab.CONNECTIONS:
                return <ConnectionPanel
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
                />;
            case AppTab.OBS_STUDIO:
                if (!isConnected || !obsServiceInstance) {
                    return <p className="text-center text-[var(--ctp-subtext0)] mt-8"><span className="emoji">🔗</span> Please connect to OBS WebSocket in the Connections tab to begin.</p>;
                }
                return <ObsMainControls
                    obsService={obsServiceInstance!}
                    onRefreshData={fetchData}
                    setErrorMessage={setErrorMessage}
                    onSendToGeminiContext={handleSendToGeminiContext}
                    accentColorName={theme.accent}
                />;
            case AppTab.SETTINGS:
                return <ObsSettingsPanel
                    selectedAccentColorName={theme.accent}
                    onAccentColorNameChange={(color) => actions.setThemeColor('accent', color)}
                    selectedSecondaryAccentColorName={theme.secondaryAccent}
                    onSecondaryAccentColorNameChange={(color) => actions.setThemeColor('secondaryAccent', color)}
                    selectedUserChatBubbleColorName={theme.userChatBubble}
                    onUserChatBubbleColorNameChange={(color) => actions.setThemeColor('userChatBubble', color)}
                    selectedModelChatBubbleColorName={theme.modelChatBubble}
                    onModelChatBubbleColorNameChange={(color) => actions.setThemeColor('modelChatBubble', color)}
                    flipSides={flipSides}
                    setFlipSides={actions.toggleFlipSides}
                />;
            case AppTab.GEMINI:
                const effectiveApiKey = envApiKey || geminiApiKey;
                return <GeminiChat
                    geminiApiKeyFromInput={effectiveApiKey}
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
                />;
            default:
                return null;
        }
    };

    return (
        <div className="h-screen max-h-screen bg-gradient-to-br from-[var(--ctp-crust)] to-[var(--ctp-base)] text-[var(--ctp-text)] flex flex-col overflow-hidden">
            <header ref={headerRef} className="sticky top-0 z-20 bg-ctp-crust p-2 shadow-lg h-16 flex justify-center items-center">
                <AnimatedTitleLogos />
            </header>

            <nav
                className="sticky z-10 bg-ctp-mantle border-b border-ctp-surface1 shadow-md px-2"
                style={{ top: `${headerHeight}px` }}
            >
                <div className="flex justify-center space-x-0.5">
                    {tabOrder.map(tab => {
                        const isActive = activeTab === tab;
                        const isConnectionsTab = tab === AppTab.CONNECTIONS;

                        // Define connection status color for the connections tab icon
                        let connectionIconColor = '';
                        if (isConnectionsTab) {
                            if (isConnecting) {
                                connectionIconColor = 'text-[var(--ctp-yellow)]';
                            } else if (isConnected && isGeminiClientInitialized) {
                                connectionIconColor = 'text-[var(--ctp-green)]';
                            } else if (isConnected) {
                                connectionIconColor = 'text-[var(--ctp-blue)]';
                            } else {
                                connectionIconColor = 'text-[var(--ctp-red)]';
                            }
                        }

                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                style={isActive ? { backgroundColor: 'var(--dynamic-accent)', color: 'var(--ctp-base)' } : {}}
                                className={`px-3 py-1.5 rounded-t-lg text-xs font-medium transition-all duration-200 ease-in-out transform hover:-translate-y-0.5
                                ${!isActive
                                        ? 'bg-[var(--ctp-surface0)] hover:bg-[var(--ctp-surface1)] text-[var(--ctp-subtext1)] hover:text-[var(--ctp-text)]'
                                        : 'shadow-lg'}`}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                <span className={`tab-emoji ${isConnectionsTab ? `${connectionIconColor} ${isConnecting ? 'animate-pulse' : ''}` : ''}`}>
                                    {tabEmojis[tab]}
                                </span> {tab}
                            </button>
                        );
                    })}
                </div>
            </nav>



            <main className="flex-grow overflow-y-auto p-2">
                {isConnecting && !isConnected && (
                    <div className="flex justify-center items-center mt-1 text-[var(--ctp-peach)]">
                        <LoadingSpinner size={5} />
                        <span className="ml-2 text-sm">Connecting to OBS...</span>
                    </div>
                )}

                {errorMessage && (
                    <Modal title="❗ Application Error" onClose={() => setErrorMessage(null)} accentColorName={theme.accent}>
                        <p>{errorMessage}</p>
                    </Modal>
                )}

                <div ref={tabContentRef} key={activeTab} className="flex-grow flex flex-col min-h-0 h-full">
                    {renderTabContent()}
                </div>
            </main>
        </div>
    );
};

export default App;
