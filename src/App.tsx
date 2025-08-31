import React, { useState, useRef, useCallback, useEffect } from 'react';
import { gsap } from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import ErrorBoundary from './components/common/ErrorBoundary';
import { Header } from './components/layout/Header'; // Keep Header imported
import { TabNavigation } from './components/layout/TabNavigation';
import { AppTab } from './types';
import { ConnectionProvider } from './components/ConnectionProvider';
import { useConnectionManagerStore } from './store/connectionManagerStore';
import { GeminiChat } from './features/chat/GeminiChat';
import { ConnectionPanel } from './features/connections/ConnectionPanel';
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
    const [headerHeight, setHeaderHeight] = useState(64); // State to store header height
    
    const { actions } = useConnectionManagerStore();

    const handleTabChange = useCallback((tab: AppTab) => {
        setActiveTab(tab);
    }, []);

    // Set header height on mount and resize
    useEffect(() => {
        if (headerRef.current) {
            setHeaderHeight(headerRef.current.offsetHeight);
        }
    }, []);

    const handleStreamerBotAction = async (action: { type: string; args?: Record<string, unknown> }) => {
        console.log('Streamer.bot action:', action);
    };

    const renderTabContent = useCallback(() => { // Memoize renderTabContent
        switch (activeTab) {
            case AppTab.CONNECTIONS:
                return <ConnectionPanel />;
            case AppTab.OBS_STUDIO:
                return <ObsStudioTab />;
            case AppTab.GEMINI:
                return (
                    <GeminiChat
                        onRefreshData={async () => { /* no-op as per new connection strategy */ }}
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
    }, [activeTab, chatInputValue]); // Add dependencies for renderTabContent

    return (
        <ErrorBoundary>
            <ConnectionProvider>
                <div className="h-screen max-h-screen bg-gradient-to-br from-background to-card text-foreground flex flex-col overflow-hidden">
                    {/* Header and TabNavigation are now separate components */}
                    <Header headerRef={headerRef} /> {/* Render Header outside TabNavigation */}
                    <TabNavigation
                        activeTab={activeTab}
                        setActiveTab={handleTabChange}
                        headerRef={headerRef}
                        headerHeight={headerHeight}
                        renderTabContent={renderTabContent}
                    />
                </div>
            </ConnectionProvider>
        </ErrorBoundary>
    );
};

export default App;
