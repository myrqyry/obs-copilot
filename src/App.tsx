import React, { useState, useEffect, useRef } from 'react';
import ErrorBoundary from './components/common/ErrorBoundary';
import { useStreamerBotConnection } from './hooks/useStreamerBotConnection';
import { useTheme } from './hooks/useTheme';
import { Header } from './components/layout/Header';
import { catppuccinAccentColorsHexMap, catppuccinSecondaryAccentColorsHexMap } from './types';
import { TabNavigation } from './components/layout/TabNavigation';
import { ConnectionPanel } from './components/ConnectionPanel';
import { ObsMainControls } from './components/ObsMainControls';
import { ObsSettingsPanel } from './components/ObsSettingsPanel';
import AdvancedPanel from './components/AdvancedPanel';
import { GeminiChat } from './components/GeminiChat';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { Modal } from './components/common/Modal';
import StreamingAssetsTab from './components/StreamingAssetsTab';
import CreateTab from './components/CreateTab';
import { AppTab, ChatMessage } from './types';
import { StreamerBotService } from './services/streamerBotService';
import { useConnectionManagerStore } from './store/connectionManagerStore';
import { useChatStore } from './store/chatStore';
import { useSettingsStore } from './store/settingsStore';
import { useStreamerBotActions } from './hooks/useStreamerBotActions';
import { gsap } from 'gsap';
import MiniPlayer from './components/common/MiniPlayer';
import { NotificationManager } from './components/common/NotificationManager';
import { loadConnectionSettings, saveConnectionSettings, isStorageAvailable } from './utils/persistence';
import { DEFAULT_OBS_WEBSOCKET_URL } from './constants';
import { ObsClientImpl } from './services/obsClient';

const App: React.FC = () => {
    useTheme();
    const [activeTab, setActiveTab] = useState<AppTab>(AppTab.GEMINI);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [geminiChatInput, setGeminiChatInput] = useState<string>('');
    const {
        isConnected,
        isConnecting,
        connectError,
        obsServiceInstance,
        actions: connectionManagerActions
    } = useConnectionManagerStore();

    const { geminiMessages, geminiApiKey, isGeminiClientInitialized, geminiInitializationError, actions: chatActions } = useChatStore();
    const { flipSides, theme, actions: settingsActions, extraDarkMode: extraDarkModeFromStore } = useSettingsStore();

    const handleConnect = async (address: string, password?: string) => {
        if (obsServiceInstance) {
            await connectionManagerActions.setDisconnected();
        }
        connectionManagerActions.setConnecting();
        const obsClient = new ObsClientImpl();
        connectionManagerActions.setObsServiceInstance(obsClient);

        try {
            await obsClient.connect(address, password);
            const obsData = {
                scenes: await obsClient.getSceneList(),
                currentProgramScene: (await obsClient.getCurrentProgramScene()).currentProgramSceneName,
                sources: await obsClient.getSources(),
                streamStatus: await obsClient.getStreamStatus(),
                recordStatus: await obsClient.getRecordStatus(),
                videoSettings: await obsClient.getVideoSettings(),
                streamerName: null,
            };
            connectionManagerActions.setConnected(obsData);
            setErrorMessage(null);
        } catch (err: any) {
            console.error("Failed to connect to OBS:", err);
            connectionManagerActions.setDisconnected(err.message);
            setErrorMessage(`Failed to connect to OBS: ${err.message}`);
        }
    };

    const handleDisconnect = async () => {
        if (obsServiceInstance) {
            await obsServiceInstance.disconnect();
            connectionManagerActions.setDisconnected();
        }
    };

    const fetchData = async () => {
        if (obsServiceInstance && isConnected) {
            try {
                const scenes = await obsServiceInstance.getSceneList();
                const currentProgramScene = (await obsServiceInstance.getCurrentProgramScene()).currentProgramSceneName;
                const sources = await obsServiceInstance.getSources();
                const streamStatus = await obsServiceInstance.getStreamStatus();
                const recordStatus = await obsServiceInstance.getRecordStatus();
                const videoSettings = await obsServiceInstance.getVideoSettings();
                connectionManagerActions.updateOBSData({
                    scenes: scenes.scenes,
                    currentProgramScene: currentProgramScene,
                    sources: sources.inputs,
                    streamStatus: streamStatus,
                    recordStatus: recordStatus,
                    videoSettings: videoSettings,
                });
            } catch (error: any) {
                console.error("Failed to fetch OBS data:", error);
            }
        }
    };

    const streamerBotService = useRef(new StreamerBotService()).current;
    const { isStreamerBotConnected, isStreamerBotConnecting, handleStreamerBotConnect, handleStreamerBotDisconnect } = useStreamerBotConnection(streamerBotService);
    const { handleStreamerBotAction } = useStreamerBotActions({ streamerBotService, onAddMessage: chatActions.addMessage, setErrorMessage });
    const tabContentRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const [headerHeight, setHeaderHeight] = useState(64);

    const [streamerBotAddress, setStreamerBotAddress] = useState<string>(
        isStorageAvailable() ? (loadConnectionSettings().streamerBotAddress || 'localhost') : 'localhost'
    );
    const [streamerBotPort, setStreamerBotPort] = useState<string>(
        isStorageAvailable() ? (loadConnectionSettings().streamerBotPort || '8080') : '8080'
    );

    useEffect(() => {
        if (headerRef.current) {
            setHeaderHeight(headerRef.current.offsetHeight);
        }
    }, []);

    useEffect(() => {
        if (connectError) {
            setActiveTab(AppTab.CONNECTIONS);
        }
    }, [connectError]);

    const setupObsListeners = (obsInstance: ObsClientImpl, fetch: () => void) => {
        const events = [
            'CurrentProgramSceneChanged',
            'SceneItemListReindexed',
            'InputCreated',
            'InputRemoved',
        ];
        const listener = () => fetch();
        events.forEach(event => obsInstance.on(event, listener));
        return () => {
            events.forEach(event => obsInstance.off(event, listener));
        };
    };

    useEffect(() => {
        if (isConnected && obsServiceInstance) {
            const cleanup = setupObsListeners(obsServiceInstance, fetchData);
            return cleanup;
        }
    }, [isConnected, obsServiceInstance, fetchData]);

    useEffect(() => {
        if (tabContentRef.current) {
            gsap.fromTo(tabContentRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2 });
        }
    }, [activeTab]);

    const handleSendToGeminiContext = (contextText: string) => {
        chatActions.addSystemMessageToChat(contextText);
    };

    const tabComponents: Record<AppTab, React.ReactNode> = {
        [AppTab.CONNECTIONS]: <ConnectionPanel onConnect={handleConnect} onDisconnect={handleDisconnect} isConnected={isConnected} isConnecting={isConnecting} error={connectError} geminiApiKey={geminiApiKey} onGeminiApiKeyChange={chatActions.setGeminiApiKey} isGeminiClientInitialized={isGeminiClientInitialized} geminiInitializationError={geminiInitializationError} accentColorName={theme.accent} streamerBotAddress={streamerBotAddress} setStreamerBotAddress={setStreamerBotAddress} streamerBotPort={streamerBotPort} setStreamerBotPort={setStreamerBotPort} onStreamerBotConnect={() => handleStreamerBotConnect(streamerBotAddress, streamerBotPort)} onStreamerBotDisconnect={handleStreamerBotDisconnect} isStreamerBotConnected={isStreamerBotConnected} isStreamerBotConnecting={isStreamerBotConnecting} defaultUrl={DEFAULT_OBS_WEBSOCKET_URL} />,
        [AppTab.OBS_STUDIO]: <>{!isConnected || !obsServiceInstance ? <p>Please connect to OBS.</p> : <ObsMainControls obsService={obsServiceInstance} onRefreshData={() => fetchData()} setErrorMessage={setErrorMessage} addSystemMessageToChat={handleSendToGeminiContext} accentColorName={theme.accent} />}</>,
        [AppTab.SETTINGS]: <ObsSettingsPanel selectedAccentColorName={theme.accent} selectedSecondaryAccentColorName={theme.secondaryAccent} selectedUserChatBubbleColorName={theme.userChatBubble} selectedModelChatBubbleColorName={theme.modelChatBubble} flipSides={flipSides} actions={settingsActions} />,
        [AppTab.ADVANCED]: <AdvancedPanel />,
        [AppTab.GEMINI]: <GeminiChat streamerBotService={streamerBotService} onRefreshData={async () => { if (obsServiceInstance) await fetchData(); }} setErrorMessage={setErrorMessage} chatInputValue={geminiChatInput} onChatInputChange={setGeminiChatInput} accentColorName={theme.accent} messages={geminiMessages} onAddMessage={chatActions.addMessage} isGeminiClientInitialized={isGeminiClientInitialized} geminiInitializationError={geminiInitializationError} onSetIsGeminiClientInitialized={chatActions.setGeminiClientInitialized} onSetGeminiInitializationError={chatActions.setGeminiInitializationError} activeTab={activeTab} onStreamerBotAction={handleStreamerBotAction} />,
        [AppTab.STREAMING_ASSETS]: <StreamingAssetsTab />,
        [AppTab.CREATE]: <CreateTab />,
    };

    return (
        <ErrorBoundary>
            <div className="h-screen max-h-screen bg-gradient-to-br from-background to-card text-foreground flex flex-col overflow-hidden">
                <Header headerRef={headerRef} accentColor={catppuccinAccentColorsHexMap[theme.accent]} secondaryAccentColor={catppuccinSecondaryAccentColorsHexMap[theme.secondaryAccent]} />
                <div className="sticky z-10 px-2 pt-2" style={{ top: `${headerHeight}px` }}>
                    <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} tabOrder={[AppTab.GEMINI, AppTab.OBS_STUDIO, AppTab.STREAMING_ASSETS, AppTab.CREATE, AppTab.SETTINGS, AppTab.CONNECTIONS, AppTab.ADVANCED]} />
                </div>
                <main className="flex-grow overflow-y-auto px-1 sm:px-2 pb-1">
                    {isConnecting && !isConnected && <div className="flex justify-center items-center mt-1 text-orange-500 p-2"><LoadingSpinner size={4} /><span className="ml-2 text-sm">Connecting to OBS...</span></div>}
                    {errorMessage && <Modal title="Error" onClose={() => setErrorMessage(null)}><p>{errorMessage}</p></Modal>}
                    <div ref={tabContentRef} id={`tabpanel-${activeTab}`} role="tabpanel" aria-labelledby={`tab-${activeTab}`} className="flex-grow flex flex-col min-h-0 h-full">
                        {tabComponents[activeTab]}
                    </div>
                    <MiniPlayer />
                </main>
                <NotificationManager />
            </div>
        </ErrorBoundary>
    );
};

export default App;
