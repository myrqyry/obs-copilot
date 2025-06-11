import React, { useState, useEffect, useCallback, useRef } from 'react';
import { gsap } from 'gsap';
import OBSWebSocket, { EventSubscription } from 'obs-websocket-js';
// Import GSAP test for development verification
import './utils/gsapTest';
import { ConnectionForm } from './components/ConnectionForm';
import { ObsMainControls } from './components/ObsMainControls';
import { ObsSettingsPanel } from './components/ObsSettingsPanel';
import { GeminiChat } from './components/GeminiChat';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { Modal } from './components/common/Modal';
import {
  AppTab,
  OBSScene,
  OBSSource,
  OBSStreamStatus,
  OBSRecordStatus,
  OBSVideoSettings,
  CatppuccinAccentColorName,
  catppuccinAccentColorsHexMap,
  CatppuccinSecondaryAccentColorName,
  catppuccinSecondaryAccentColorsHexMap,
  CatppuccinChatBubbleColorName,
  catppuccinChatBubbleColorsHexMap,
  ChatMessage
} from './types';
import { OBSWebSocketService } from './services/obsService';
import { DEFAULT_OBS_WEBSOCKET_URL } from './constants';
import { AnimatedTitleLogos } from './components/common/AnimatedTitleLogos';
import { ConnectionStatusIcon } from './components/ConnectionStatusIcon';

const App: React.FC = () => {
  const [obs, setObs] = useState<OBSWebSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const [scenes, setScenes] = useState<OBSScene[]>([]);
  const [currentProgramScene, setCurrentProgramScene] = useState<string | null>(null);
  const [sources, setSources] = useState<OBSSource[]>([]);

  const [streamStatus, setStreamStatus] = useState<OBSStreamStatus | null>(null);
  const [recordStatus, setRecordStatus] = useState<OBSRecordStatus | null>(null);
  const [videoSettings, setVideoSettings] = useState<OBSVideoSettings | null>(null);

  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.GEMINI);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [obsServiceInstance, setObsServiceInstance] = useState<OBSWebSocketService | null>(null);
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState<boolean>(false);
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [geminiChatInput, setGeminiChatInput] = useState<string>('');

  const [selectedAccentColorName, setSelectedAccentColorName] = useState<CatppuccinAccentColorName>('mauve');
  const [selectedSecondaryAccentColorName, setSelectedSecondaryAccentColorName] = useState<CatppuccinSecondaryAccentColorName>('flamingo');
  const [selectedUserChatBubbleColorName, setSelectedUserChatBubbleColorName] = useState<CatppuccinChatBubbleColorName>('blue');
  const [selectedModelChatBubbleColorName, setSelectedModelChatBubbleColorName] = useState<CatppuccinChatBubbleColorName>('lavender');

  const [geminiMessages, setGeminiMessages] = useState<ChatMessage[]>([]);
  const [isGeminiClientInitialized, setIsGeminiClientInitialized] = useState<boolean>(false);
  const [geminiInitializationError, setGeminiInitializationError] = useState<string | null>(null);

  const tabContentRef = useRef<HTMLDivElement>(null);
  const tabOrder: AppTab[] = [AppTab.GEMINI, AppTab.CONTROLS, AppTab.SETTINGS];
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(64); // Default height, update if needed

  useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight);
    }
  }, []);


  useEffect(() => {
    document.documentElement.style.setProperty('--dynamic-accent', catppuccinAccentColorsHexMap[selectedAccentColorName]);
    document.documentElement.style.setProperty('--dynamic-secondary-accent', catppuccinSecondaryAccentColorsHexMap[selectedSecondaryAccentColorName]);
    document.documentElement.style.setProperty('--user-chat-bubble-color', catppuccinChatBubbleColorsHexMap[selectedUserChatBubbleColorName]);
    document.documentElement.style.setProperty('--model-chat-bubble-color', catppuccinChatBubbleColorsHexMap[selectedModelChatBubbleColorName]);
  }, [selectedAccentColorName, selectedSecondaryAccentColorName, selectedUserChatBubbleColorName, selectedModelChatBubbleColorName]);

  const addGeminiMessageInternal = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    setGeminiMessages(prev => [...prev, { ...message, id: Date.now().toString() + Math.random(), timestamp: new Date() }]);
  };

  useEffect(() => {
    const effectiveApiKey = geminiApiKey || process.env.API_KEY;
    const initialMessageExists = geminiMessages.some(m => m.role === 'system' && (m.text.includes("Gemini Assistant initialized") || m.text.includes("API Key must be configured") || m.text.includes("Failed to initialize Gemini client")));

    if (!initialMessageExists) {
      if (geminiInitializationError) {
        addGeminiMessageInternal({ role: 'system', text: `❗ ${geminiInitializationError}` });
      } else if (isGeminiClientInitialized) {
        addGeminiMessageInternal({ role: 'system', text: "Gemini Assistant initialized. Ready for your commands! ✨" });
      } else if (!effectiveApiKey && !isGeminiClientInitialized) {
        addGeminiMessageInternal({ role: 'system', text: "Gemini API Key needs to be provided via input or environment variable for Gemini features to work." });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGeminiClientInitialized, geminiInitializationError, geminiApiKey]);


  const addGeminiMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    addGeminiMessageInternal(message);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleConnect = useCallback(async (address: string, password?: string) => {
    setIsConnecting(true);
    setConnectError(null);
    const newObs = new OBSWebSocket();
    try {
      await newObs.connect(address, password, {
        eventSubscriptions: EventSubscription.All
      });
      setObs(newObs);
      setObsServiceInstance(new OBSWebSocketService(newObs));
      setIsConnected(true);
      setIsConnectionModalOpen(false);
    } catch (error: any) {
      console.error("Connection failed:", error);
      setConnectError(error.message || "Failed to connect to OBS WebSocket. Check address and password.");
      setIsConnected(false);
      setObsServiceInstance(null);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const handleDisconnect = useCallback(async () => {
    if (obs) {
      await obs.disconnect();
      setObs(null);
      setObsServiceInstance(null);
      setIsConnected(false);
      setScenes([]);
      setCurrentProgramScene(null);
      setSources([]);
      setStreamStatus(null);
      setRecordStatus(null);
      setVideoSettings(null);
    }
  }, [obs]);

  useEffect(() => {
    if (connectError && !isConnectionModalOpen) {
      setIsConnectionModalOpen(true);
    }
  }, [connectError, isConnectionModalOpen]);

  const fetchData = useCallback(async () => {
    if (!obsServiceInstance || !isConnected) return;
    try {
      const [scenesData, currentProgramSceneData, streamStatusData, recordStatusData, videoSettingsData] = await Promise.all([
        obsServiceInstance.getSceneList(),
        obsServiceInstance.getCurrentProgramScene(),
        obsServiceInstance.getStreamStatus(),
        obsServiceInstance.getRecordStatus(),
        obsServiceInstance.getVideoSettings(),
      ]);

      setScenes(scenesData.scenes.map(s => ({
        sceneName: String(s.sceneName ?? ''),
        sceneIndex: Number(s.sceneIndex ?? 0)
      })));
      setCurrentProgramScene(currentProgramSceneData.currentProgramSceneName);
      setStreamStatus(streamStatusData);
      setRecordStatus(recordStatusData);
      setVideoSettings(videoSettingsData);

      if (currentProgramSceneData.currentProgramSceneName) {
        const sourcesData = await obsServiceInstance.getSceneItemList(currentProgramSceneData.currentProgramSceneName);
        setSources(sourcesData.sceneItems.map(item => ({
          sourceName: String(item.sourceName ?? ''),
          sceneItemId: Number(item.sceneItemId ?? 0),
          sceneItemEnabled: Boolean(item.sceneItemEnabled ?? false),
          inputKind: String(item.inputKind ?? '')
        })));
      } else {
        setSources([]);
      }
      setConnectError(null);
    } catch (error: any) {
      console.error("Error fetching OBS data:", error);
      setErrorMessage(`Error fetching OBS data: ${error.message}`);
      if (error.message?.toLowerCase().includes('not connected') || error.message?.toLowerCase().includes('connection closed')) {
        setIsConnected(false);
        setConnectError('Connection to OBS lost. Please reconnect.');
        setIsConnectionModalOpen(true);
      }
    }
  }, [obsServiceInstance, isConnected]);

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
    [AppTab.GEMINI]: '✨',
    [AppTab.CONTROLS]: '🕹️',
    [AppTab.SETTINGS]: '⚙️',
  };

  const handleSendToGeminiContext = useCallback((contextText: string) => {
    setGeminiChatInput(prevInput => `${contextText}${prevInput}`);
    setActiveTab(AppTab.GEMINI);
    setTimeout(() => document.getElementById('gemini-input')?.focus(), 0);
  }, []);

  const renderTabContent = () => {
    if (!isConnected || !obsServiceInstance) {
      return <p className="text-center text-[var(--ctp-subtext0)] mt-8">🔗 Please connect to OBS WebSocket to begin. Click the 🔗 icon in the top right.</p>;
    }
    switch (activeTab) {
      case AppTab.CONTROLS:
        return <ObsMainControls
          obsService={obsServiceInstance}
          scenes={scenes}
          currentProgramScene={currentProgramScene}
          sources={sources}
          streamStatus={streamStatus}
          recordStatus={recordStatus}
          onRefreshData={fetchData}
          setErrorMessage={setErrorMessage}
          onSendToGeminiContext={handleSendToGeminiContext}
          accentColorName={selectedAccentColorName}
        />;
      case AppTab.SETTINGS:
        return <ObsSettingsPanel
          obsService={obsServiceInstance}
          videoSettings={videoSettings}
          onSettingsChanged={fetchData}
          setErrorMessage={setErrorMessage}
          selectedAccentColorName={selectedAccentColorName}
          onAccentColorNameChange={setSelectedAccentColorName}
          selectedSecondaryAccentColorName={selectedSecondaryAccentColorName}
          onSecondaryAccentColorNameChange={setSelectedSecondaryAccentColorName}
          selectedUserChatBubbleColorName={selectedUserChatBubbleColorName}
          onUserChatBubbleColorNameChange={setSelectedUserChatBubbleColorName}
          selectedModelChatBubbleColorName={selectedModelChatBubbleColorName}
          onModelChatBubbleColorNameChange={setSelectedModelChatBubbleColorName}
        />;
      case AppTab.GEMINI:
        return <GeminiChat
          geminiApiKeyFromInput={geminiApiKey}
          obsService={obsServiceInstance}
          obsData={{ scenes, currentProgramScene, sources, streamStatus, videoSettings }}
          onRefreshData={fetchData}
          setErrorMessage={setErrorMessage}
          chatInputValue={geminiChatInput}
          onChatInputChange={setGeminiChatInput}
          accentColorName={selectedAccentColorName}
          messages={geminiMessages}
          onAddMessage={addGeminiMessage}
          isGeminiClientInitialized={isGeminiClientInitialized}
          geminiInitializationError={geminiInitializationError}
          onSetIsGeminiClientInitialized={setIsGeminiClientInitialized}
          onSetGeminiInitializationError={setGeminiInitializationError}
          activeTab={activeTab}
        />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen max-h-screen bg-gradient-to-br from-[var(--ctp-crust)] to-[var(--ctp-base)] text-[var(--ctp-text)] flex flex-col overflow-hidden">
      <header ref={headerRef} className="sticky top-0 z-20 bg-ctp-crust p-2 shadow-lg h-16 flex justify-between items-center">
        <AnimatedTitleLogos />
        <ConnectionStatusIcon
          isConnected={isConnected}
          isConnecting={isConnecting}
          error={connectError !== null || geminiInitializationError !== null}
          onClick={() => setIsConnectionModalOpen(true)}
        />
      </header>

      {isConnected && (
        <nav
          className="sticky z-10 bg-ctp-mantle border-b border-ctp-surface1 shadow-md px-2"
          style={{ top: `${headerHeight}px` }}
        >
          <div className="flex justify-center space-x-0.5">
            {tabOrder.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={activeTab === tab ? { backgroundColor: 'var(--dynamic-accent)', color: 'var(--ctp-base)' } : {}}
                className={`px-3 py-1.5 rounded-t-lg text-xs font-medium transition-all duration-200 ease-in-out transform hover:-translate-y-0.5
                            ${activeTab !== tab
                    ? 'bg-[var(--ctp-surface0)] hover:bg-[var(--ctp-surface1)] text-[var(--ctp-subtext1)] hover:text-[var(--ctp-text)]'
                    : 'shadow-lg'}`}
                aria-current={activeTab === tab ? 'page' : undefined}
              >
                {tabEmojis[tab]} {tab}
              </button>
            ))}
          </div>
        </nav>
      )}

      <main className="flex-grow overflow-y-auto p-2">
        {isConnectionModalOpen && (
          <Modal title="🔌 Connection Settings" onClose={() => setIsConnectionModalOpen(false)} accentColorName={selectedAccentColorName}>
            <ConnectionForm
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              isConnected={isConnected}
              isConnecting={isConnecting}
              defaultUrl={DEFAULT_OBS_WEBSOCKET_URL}
              error={connectError}
              geminiApiKey={geminiApiKey}
              onGeminiApiKeyChange={setGeminiApiKey}
              isGeminiClientInitialized={isGeminiClientInitialized}
              geminiInitializationError={geminiInitializationError}
              accentColorName={selectedAccentColorName}
            />
          </Modal>
        )}

        {isConnecting && !isConnected && (
          <div className="flex justify-center items-center mt-1 text-[var(--ctp-peach)]">
            <LoadingSpinner size={5} />
            <span className="ml-2 text-sm">Connecting to OBS...</span>
          </div>
        )}

        {errorMessage && (
          <Modal title="❗ Application Error" onClose={() => setErrorMessage(null)} accentColorName={selectedAccentColorName}>
            <p>{errorMessage}</p>
          </Modal>
        )}

        {isConnected ? (
          <div ref={tabContentRef} key={activeTab} className="flex-grow flex flex-col min-h-0 h-full"> {/* Ensure GeminiChat can be h-full */}
            {renderTabContent()}
          </div>
        ) : (
          !isConnecting && !isConnectionModalOpen && (
            <p className="text-center text-[var(--ctp-subtext0)] mt-2">🔗 Connect to OBS to unlock the magic! Click the 🔗 icon in the top right.</p>
          )
        )}
      </main>
    </div>
  );
};

export default App;
