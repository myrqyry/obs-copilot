import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { AppTab, ChatMessage, OBSScene, OBSSource } from './types';
import { StreamerBotService } from './services/streamerBotService';
import { useConnectionManagerStore } from './store/connectionManagerStore';
import { useChatStore } from './store/chatStore';
import { useSettingsStore } from './store/settingsStore';
import { useStreamerBotActions } from './hooks/useStreamerBotActions';
import { CatppuccinAccentColorName } from './types/themes';
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
    const isConnected = useConnectionManagerStore(state => state.isConnected);
    const isConnecting = useConnectionManagerStore(state => state.isConnecting);
    const connectError = useConnectionManagerStore(state => state.connectError);
    const obsServiceInstance = useConnectionManagerStore(state => state.obsServiceInstance);
    const connectionManagerActions = useConnectionManagerStore(state => state.actions);

    const { actions: chatActions } = useChatStore();
    const { actions: settingsActions } = useSettingsStore();
    const theme = useSettingsStore(state => state.theme);

const fetchData = useCallback(async () => {
  if (obsServiceInstance && isConnected) {
    try {
        const results = await Promise.allSettled([
            obsServiceInstance.getSceneList(),
            obsServiceInstance.getCurrentProgramScene(),
            obsServiceInstance.getInputs(),
            obsServiceInstance.getStreamStatus(),
            obsServiceInstance.getRecordStatus(),
            obsServiceInstance.getVideoSettings(),
        ]);

        const [
            scenesResult,
            currentProgramSceneResult,
            sourcesResult,
            streamStatusResult,
            recordStatusResult,
            videoSettingsResult,
        ] = results;

        const scenes = scenesResult.status === 'fulfilled' ? scenesResult.value.scenes.map((scene) => ({ sceneName: scene.sceneName, sceneIndex: scene.sceneIndex })) : [];
        const currentProgramScene = currentProgramSceneResult.status === 'fulfilled' ? currentProgramSceneResult.value.sceneName : null;
        const sources = sourcesResult.status === 'fulfilled' ? sourcesResult.value.inputs.map((input) => ({ sourceName: input.inputName, typeName: input.inputKind, sceneItemId: 0, sceneItemEnabled: true })) : [];
        const streamStatus = streamStatusResult.status === 'fulfilled' ? streamStatusResult.value : null;
        const recordStatus = recordStatusResult.status === 'fulfilled' ? recordStatusResult.value : null;
        const videoSettings = videoSettingsResult.status === 'fulfilled' ? videoSettingsResult.value : null;

        connectionManagerActions.updateOBSData({
            scenes,
            currentProgramScene,
            sources,
            streamStatus,
            recordStatus,
            videoSettings: videoSettings ? {
                baseWidth: videoSettings.baseWidth,
                baseHeight: videoSettings.baseHeight,
                outputWidth: videoSettings.outputWidth,
                outputHeight: videoSettings.outputHeight,
                fpsNumerator: videoSettings.fpsNumerator,
                fpsDenominator: videoSettings.fpsDenominator,
            } : null,
            streamerName: null,
        });

        results.forEach(result => {
            if (result.status === 'rejected') {
                console.error("Failed to fetch some OBS data:", result.reason);
            }
        });

    } catch (error: any) {
      console.error("A critical error occurred during data fetch:", error);
    }
  }
}, [obsServiceInstance, isConnected, connectionManagerActions]);

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
  const eventHandlers: Partial<Record<string, () => void>> = {};
  events.forEach((event) => {
    eventHandlers[event] = fetch;
  });
  obsInstance.subscribeToEvents(eventHandlers);
  return () => {
    obsInstance.unsubscribeFromEvents(eventHandlers);
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
        [AppTab.CONNECTIONS]: <ConnectionPanel isConnected={isConnected} isConnecting={isConnecting} error={connectError} streamerBotAddress={streamerBotAddress} setStreamerBotAddress={setStreamerBotAddress} streamerBotPort={streamerBotPort} setStreamerBotPort={setStreamerBotPort} onStreamerBotConnect={() => handleStreamerBotConnect(streamerBotAddress, streamerBotPort)} onStreamerBotDisconnect={handleStreamerBotDisconnect} isStreamerBotConnected={isStreamerBotConnected} isStreamerBotConnecting={isStreamerBotConnecting} defaultUrl={DEFAULT_OBS_WEBSOCKET_URL} />,
        [AppTab.OBS_STUDIO]: <>{!isConnected || !obsServiceInstance ? <p>Please connect to OBS.</p> : <ObsMainControls obsService={obsServiceInstance} onRefreshData={() => fetchData()} setErrorMessage={setErrorMessage} addSystemMessageToChat={handleSendToGeminiContext} />}</>,
        [AppTab.SETTINGS]: <ObsSettingsPanel
          actions={{
            setThemeColor: (themeKey, colorName) => settingsActions.setThemeColor(themeKey, colorName as CatppuccinAccentColorName),
            toggleFlipSides: settingsActions.toggleFlipSides,
            toggleAutoApplySuggestions: settingsActions.toggleAutoApplySuggestions,
            toggleExtraDarkMode: settingsActions.toggleExtraDarkMode,
            setCustomChatBackground: settingsActions.setCustomChatBackground,
          }}
        />,
        [AppTab.ADVANCED]: <AdvancedPanel />,
        [AppTab.GEMINI]: <GeminiChat streamerBotService={streamerBotService} onRefreshData={async () => { if (obsServiceInstance) await fetchData(); }} setErrorMessage={setErrorMessage} chatInputValue={geminiChatInput} onChatInputChange={setGeminiChatInput} activeTab={activeTab} onStreamerBotAction={handleStreamerBotAction} />,
        [AppTab.STREAMING_ASSETS]: <StreamingAssetsTab />,
        [AppTab.CREATE]: <CreateTab />,
    };

    return (
        <ErrorBoundary>
            <div className="h-screen max-h-screen bg-gradient-to-br from-background to-card text-foreground flex flex-col overflow-hidden">
                <Header headerRef={headerRef} />
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
