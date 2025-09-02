import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ConnectionProvider } from './components/ConnectionProvider';
import { Header } from './components/layout/Header';
import { TabNavigation } from './components/layout/TabNavigation';
import useSettingsStore from './store/settingsStore';
import ObsStudioTab from './components/ui/ObsStudioTab';
import StreamingAssetsTab from './components/ui/StreamingAssetsTab';
import SettingsTab from './components/ui/SettingsTab';
import CreateTab from './components/ui/CreateTab';
import { AppTab } from './types'; // Correctly import AppTab
import { useTheme } from './hooks/useTheme';
import { logger } from './utils/logger';
import { gsap } from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import ComprehensiveErrorBoundary from './components/common/ComprehensiveErrorBoundary';
import { useConnectionManagerStore } from './store/connectionManagerStore';
import { GeminiChat } from './features/chat/GeminiChat';
import { ConnectionPanel } from './features/connections/ConnectionPanel';
import { useChatStore } from './store/chatStore';
import AdvancedPanel from './components/ui/AdvancedPanel';


const TAB_ORDER: AppTab[] = [
    AppTab.GEMINI,
    AppTab.OBS_STUDIO,
    AppTab.STREAMING_ASSETS,
    AppTab.CREATE,
    AppTab.SETTINGS,
    AppTab.CONNECTIONS,
    AppTab.ADVANCED,
];

try {
  gsap.registerPlugin(MorphSVGPlugin);
} catch (error) {
  logger.warn('GSAP plugin registration failed:', error);
}

const App: React.FC = () => {
    const { theme, flipSides } = useSettingsStore();

    const headerRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState<AppTab>(TAB_ORDER[0]);
    const [headerHeight, setHeaderHeight] = useState(64); // State to store header height
    const [chatInputValue, setChatInputValue] = useState('');
    
    useTheme();

    const handleTabChange = useCallback((tab: AppTab) => {
        setActiveTab(tab);
    }, []);
    
    const memoOnRefreshData = useCallback(async () => { /* no-op as per new connection strategy */ }, []);
    const memoSetErrorMessage = useCallback((msg: string | null) => {}, []);

    useEffect(() => {
        if (headerRef.current) {
            setHeaderHeight(headerRef.current.offsetHeight);
        }
    }, []);

    useEffect(() => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');

      if (theme === 'system') {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const applySystem = () => root.classList.add(mq.matches ? 'dark' : 'light');
        applySystem();

        try {
          mq.addEventListener?.('change', applySystem);
        } catch {
          mq.addListener?.(applySystem);
        }

        return () => {
          try {
            mq.removeEventListener?.('change', applySystem);
          } catch {
            mq.removeListener?.(applySystem);
          }
        };
      } else {
        root.classList.add(theme === 'dark' ? 'dark' : 'light');
      }
    }, [theme]);
    
    const handleStreamerBotAction = async (action: { type: string; args?: Record<string, unknown> }) => {
        logger.info('Streamer.bot action:', action);
    };

    const renderTabContent = useCallback(() => {
        switch (activeTab) {
            case AppTab.CONNECTIONS:
                return <div data-tab="connections"><ConnectionPanel /></div>;
            case AppTab.OBS_STUDIO:
                return <div data-tab="obs_studio"><ObsStudioTab /></div>;
            case AppTab.GEMINI:
                return (
                    <div data-tab="gemini" className="p-6">
                        <GeminiChat
                            onRefreshData={memoOnRefreshData}
                            setErrorMessage={memoSetErrorMessage}
                            chatInputValue={chatInputValue}
                            onChatInputChange={setChatInputValue}
                        />
                    </div>
                );
            case AppTab.CREATE:
                return <div data-tab="create"><CreateTab /></div>;
            case AppTab.STREAMING_ASSETS:
                return <div data-tab="streaming_assets"><StreamingAssetsTab /></div>;
            case AppTab.SETTINGS:
                return <div data-tab="settings"><SettingsTab /></div>;
            case AppTab.ADVANCED:
                return <div data-tab="advanced"><AdvancedPanel /></div>;
            default:
                return <div data-tab="unknown" className="p-6">Select a tab</div>;
        }
    }, [activeTab, chatInputValue, memoOnRefreshData, memoSetErrorMessage]);

    return (
        <ComprehensiveErrorBoundary>
            <ConnectionProvider>
                <div className={`h-screen max-h-screen bg-gradient-to-br from-background to-card text-foreground ${flipSides ? 'flex-row-reverse' : ''} flex flex-col overflow-hidden transition-colors duration-500 ease-in-out`}>
                    <Header headerRef={headerRef} />
                    <div className="sticky z-10 px-2 pt-2" style={{ top: '64px' }}>
                        <TabNavigation
                            activeTab={activeTab}
                            setActiveTab={handleTabChange}
                            headerRef={headerRef}
                            headerHeight={headerHeight}
                        >
                            {renderTabContent()}
                        </TabNavigation>
                    </div>
                    <main className="flex-grow overflow-y-auto px-1 sm:px-2 pb-1 transition-all duration-300 ease-in-out">
                        {renderTabContent()}
                    </main>
                </div>
            </ConnectionProvider>
        </ComprehensiveErrorBoundary>
    );
};

export default App;
