import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin'; // <-- IMPORT THE PLUGIN
import ErrorBoundary from './components/common/ErrorBoundary';
import { useTheme } from './hooks/useTheme';
import { Header } from './components/layout/Header';
import { TabNavigation } from './components/layout/TabNavigation';
import { ObsMainControls } from './features/connections/ObsMainControls';
import { ObsSettingsPanel } from './features/connections/ObsSettingsPanel';
import AdvancedPanel from './components/ui/AdvancedPanel';
import { GeminiChat } from './features/chat/GeminiChat';
import StreamingAssetsTab from './components/ui/StreamingAssetsTab';
import CreateTab from './components/ui/CreateTab';
import { AppTab } from './types';
import MiniPlayer from './components/common/MiniPlayer';
import { NotificationManager } from './components/common/NotificationManager';
import { ConnectionProvider } from './components/ConnectionProvider';
import { ConnectionPanel } from './features/connections/ConnectionPanel';
// Added imports for stores/hooks needed to provide proper props
import useConnectionsStore from './store/connectionsStore';
import { useChatStore } from './store/chatStore';
import { useSettingsStore } from './store/settingsStore';
import { useStreamerBotActions } from './hooks/useStreamerBotActions';

gsap.registerPlugin(MorphSVGPlugin);
const App: React.FC = () => {
    useTheme();
    const [activeTab, setActiveTab] = useState<AppTab>(AppTab.GEMINI);

    const tabContentRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const [headerHeight, setHeaderHeight] = useState(64);
    
    useEffect(() => {
        if (headerRef.current) {
            setHeaderHeight(headerRef.current.offsetHeight);
        }
    }, []);

    useEffect(() => {
        if (tabContentRef.current) {
            gsap.fromTo(tabContentRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2 });
        }
    }, [activeTab]);
    
    // --- New state & callbacks to satisfy GeminiChat props ---
    const [chatInputValue, setChatInputValue] = useState<string>('');
    const onChatInputChange = (value: string) => setChatInputValue(value);

    // Zustand stores/hooks used to provide real implementations
    const onRefreshDataFromStore = useConnectionsStore((s) => s.onRefreshData);
    const streamerBotServiceInstance = useConnectionsStore((s) => s.streamerBotServiceInstance);
    const chatActions = useChatStore((s) => s.actions);
    const settingsStoreActions = useSettingsStore((s) => s.actions);

    // Wrap the store-provided onRefreshData into an async function matching the GeminiChat signature
    const onRefreshData = async (): Promise<void> => {
        try {
            // support both sync and async implementations
            await Promise.resolve(onRefreshDataFromStore && onRefreshDataFromStore());
        } catch (err) {
            console.error('onRefreshData failed', err);
        }
    };

    // setErrorMessage delegates to chat store global error setter
    const setErrorMessage = (message: string | null) => {
        chatActions.setGlobalErrorMessage(message);
    };

    // Wire streamer.bot action handler via hook (uses streamerBotServiceInstance and chat store)
    const { handleStreamerBotAction } = useStreamerBotActions({
        streamerBotService: streamerBotServiceInstance,
        onAddMessage: chatActions.addMessage,
        setErrorMessage,
    });

    // --- ObsSettingsPanel actions mapping to settings store actions ---
    const obsSettingsActions = {
        setThemeColor: settingsStoreActions.setThemeColor,
        toggleFlipSides: settingsStoreActions.toggleFlipSides,
        toggleAutoApplySuggestions: settingsStoreActions.toggleAutoApplySuggestions,
        toggleExtraDarkMode: settingsStoreActions.toggleExtraDarkMode,
        setCustomChatBackground: settingsStoreActions.setCustomChatBackground,
        resetSettings: () => {}, // optional; no-op for now
    };

    // Properly typed tabComponents registry without type-unsafe casts
    const tabComponents: Record<AppTab, React.ReactNode> = {
        [AppTab.CONNECTIONS]: <ConnectionPanel />,
        [AppTab.OBS_STUDIO]: <ObsMainControls />,
        [AppTab.SETTINGS]: <ObsSettingsPanel actions={obsSettingsActions} />,
        [AppTab.ADVANCED]: <AdvancedPanel />,
        [AppTab.GEMINI]: (
            <GeminiChat
                onRefreshData={onRefreshData}
                setErrorMessage={setErrorMessage}
                chatInputValue={chatInputValue}
                onChatInputChange={onChatInputChange}
                onStreamerBotAction={handleStreamerBotAction}
            />
        ),
        [AppTab.STREAMING_ASSETS]: <StreamingAssetsTab />,
        [AppTab.CREATE]: <CreateTab />,
    };

    return (
        <ErrorBoundary>
            <ConnectionProvider>
                <div className="h-screen max-h-screen bg-gradient-to-br from-background to-card text-foreground flex flex-col overflow-hidden">
                     <Header headerRef={headerRef as React.RefObject<HTMLDivElement>} />
                    <div className="sticky z-10 px-2 pt-2" style={{ top: `${headerHeight}px` }}>
                        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} tabOrder={[AppTab.GEMINI, AppTab.OBS_STUDIO, AppTab.STREAMING_ASSETS, AppTab.CREATE, AppTab.SETTINGS, AppTab.CONNECTIONS, AppTab.ADVANCED]} />
                    </div>
                    <main ref={tabContentRef} className="flex-grow overflow-y-auto px-1 sm:px-2 pb-1">
                        {tabComponents[activeTab]}
                    </main>
                    <MiniPlayer />
                    <NotificationManager />
                </div>
            </ConnectionProvider>
        </ErrorBoundary>
    );
};

export default App;
