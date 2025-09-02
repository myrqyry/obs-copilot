import React, { useState, useRef, useCallback, useEffect } from 'react';
import { gsap } from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import ComprehensiveErrorBoundary from './components/common/ComprehensiveErrorBoundary'; // Use ComprehensiveErrorBoundary
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
import { useTheme } from './hooks/useTheme'; // Import useTheme hook
import { logger } from './utils/logger'; // Import logger
import { useSettingsStore } from './store/settingsStore'; // Import useSettingsStore

// Register GSAP plugins
try {
  gsap.registerPlugin(MorphSVGPlugin);
} catch (error) {
  logger.warn('GSAP plugin registration failed:', error);
}

const App: React.FC = () => {
    // Theme application handled via CSS classes and settingsStore.currentTheme
    const [activeTab, setActiveTab] = useState<AppTab>(AppTab.GEMINI);
    const [chatInputValue, setChatInputValue] = useState('');
    const headerRef = useRef<HTMLDivElement>(null);
    const [headerHeight, setHeaderHeight] = useState(64); // State to store header height
    
    const currentTheme = useSettingsStore((state) => state.currentTheme); // Get currentTheme from settingsStore
    // Ensure theme tokens and CSS variables are applied on mount and when the selected theme changes.
    // useTheme() reads the selected theme name from the store and applies the CSS vars via applyTheme().
    useTheme();

    const handleTabChange = useCallback((tab: AppTab) => {
        setActiveTab(tab);
    }, []);

    // Memoize callbacks passed into tab content to avoid calling hooks inside renderTabContent
    const memoOnRefreshData = useCallback(async () => { /* no-op as per new connection strategy */ }, []);
    const memoSetErrorMessage = useCallback((msg: string | null) => {}, []);

    // Set header height on mount and resize
    useEffect(() => {
        if (headerRef.current) {
            setHeaderHeight(headerRef.current.offsetHeight);
        }
    }, []);

    // Apply theme classes to the document root so Tailwind can react to 'dark' or 'light' mode.
    useEffect(() => {
      const root = window.document.documentElement;
      // Remove any existing explicit theme classes before applying the current one
      root.classList.remove('light', 'dark');

      if (currentTheme === 'system') {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const applySystem = () => root.classList.add(mq.matches ? 'dark' : 'light');
        applySystem();

        // Listen for system theme changes while 'system' is selected
        try {
          mq.addEventListener?.('change', applySystem);
        } catch {
          // Fallback for older browsers (e.g. Safari)
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
        root.classList.add(currentTheme === 'dark' ? 'dark' : 'light');
      }
    }, [currentTheme]);

    const handleStreamerBotAction = async (action: { type: string; args?: Record<string, unknown> }) => {
        logger.info('Streamer.bot action:', action);
    };

    const currentTabContent = useCallback(() => {
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

                <div className={`h-screen max-h-screen bg-gradient-to-br from-background to-card text-foreground flex flex-col overflow-hidden transition-colors duration-500 ease-in-out`}>
                    <TabNavigation
                        activeTab={activeTab}
                        setActiveTab={handleTabChange}
                        headerRef={headerRef}
                        headerHeight={headerHeight}
                    >
                        {currentTabContent()}
                    </TabNavigation>
                </div>
            </ConnectionProvider>
        </ComprehensiveErrorBoundary>
    );
};

export default App;
