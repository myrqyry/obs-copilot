import React, { useState, useRef, useCallback, useEffect } from 'react';
import { gsap } from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import ErrorBoundary from './components/common/ErrorBoundary';
import { Header } from './components/layout/Header';
import { TabNavigation } from './components/layout/TabNavigation';
import { AppTab } from './types';
import { ConnectionProvider } from './components/ConnectionProvider';
import { useOnRefreshData } from './hooks/useOptimizedStoreSelectors';
import { GeminiChat } from './features/chat/GeminiChat';
import ConnectionPanel from './components/ui/ConnectionPanel';
import ObsStudioTab from './components/ui/ObsStudioTab';
import CreateTab from './components/ui/CreateTab';
import StreamingAssetsTab from './components/ui/StreamingAssetsTab';
import SettingsTab from './components/ui/SettingsTab';
import AdvancedPanel from './components/ui/AdvancedPanel';

// Register GSAP plugins
try {
  gsap.registerPlugin(MorphSVGPlugin);
} catch (error) {
  console.warn('GSAP plugin registration failed:', error);
}

// Memoize tab order to prevent unnecessary re-renders
const TAB_ORDER: AppTab[] = [
    AppTab.CONNECTIONS,
    AppTab.OBS_STUDIO,
    AppTab.GEMINI,
    AppTab.CREATE,
    AppTab.STREAMING_ASSETS,
    AppTab.SETTINGS,
    AppTab.ADVANCED,
];

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState<AppTab>(AppTab.GEMINI);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [chatInputValue, setChatInputValue] = useState('');
    const headerRef = useRef<HTMLDivElement>(null);
    const onRefreshData = useOnRefreshData();

    // Memoize the tab change handler
    const handleTabChange = useCallback((tab: AppTab) => {
        setActiveTab(tab);
    }, []);

    // Handle initial data load
    useEffect(() => {
        onRefreshData?.();
    }, [onRefreshData]);

    const handleStreamerBotAction = async (action: { type: string; args?: Record<string, unknown> }) => {
        // Placeholder for Streamer.bot action
        console.log('Streamer.bot action:', action);
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case AppTab.CONNECTIONS:
                return <ConnectionPanel />;
            case AppTab.OBS_STUDIO:
                return <ObsStudioTab />;
            case AppTab.GEMINI:
                return (
                    <GeminiChat
                        onRefreshData={async () => onRefreshData?.()}
                        setErrorMessage={setErrorMessage}
                        chatInputValue={chatInputValue}
                        onChatInputChange={setChatInputValue}
                        onStreamerBotAction={handleStreamerBotAction}
                    />
                );
            case AppTab.CREATE:
                return <CreateTab />;
            case AppTab.STREAMING_ASSETS:
                return <StreamingAssetsTab />;
            case AppTab.SETTINGS:
                return <SettingsTab />;
            case AppTab.ADVANCED:
                return <AdvancedPanel />;
            default:
                return <div>Select a tab</div>;
        }
    };

    return (
        <ErrorBoundary>
            <ConnectionProvider>
                <div className="h-screen max-h-screen bg-gradient-to-br from-background to-card text-foreground flex flex-col overflow-hidden">
                    <Header headerRef={headerRef} />
                    <div className="sticky z-10 px-2 pt-2" style={{ top: '64px' }}>
                        <TabNavigation
                            activeTab={activeTab}
                            setActiveTab={handleTabChange}
                            tabOrder={TAB_ORDER}
                        />
                    </div>
                    <main className="flex-grow overflow-y-auto px-1 sm:px-2 pb-1">
                        {renderTabContent()}
                    </main>
                </div>
            </ConnectionProvider>
        </ErrorBoundary>
    );
};

export default App;
