// src/App.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import ErrorBoundary from './components/common/ErrorBoundary';
import { Header } from './components/layout/Header';
import { TabNavigation } from './components/layout/TabNavigation';
import { AppTab } from './types';
import { ConnectionProvider } from './components/ConnectionProvider';
import { GeminiChat } from './features/chat/GeminiChat';
import ConnectionPanel from './components/ui/ConnectionPanel';
import ObsStudioTab from './components/ui/ObsStudioTab';
import CreateTab from './components/ui/CreateTab';
import StreamingAssetsTab from './components/ui/StreamingAssetsTab';
import SettingsTab from './components/ui/SettingsTab';
import AdvancedPanel from './components/ui/AdvancedPanel';
import useSettingsStore from './store/settingsStore';

// Register GSAP plugins for animations
try {
  gsap.registerPlugin(MorphSVGPlugin);
} catch (error) {
  console.warn('GSAP plugin registration failed:', error);
}

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
    const { theme, flipSides } = useSettingsStore();

    const handleTabChange = useCallback((tab: AppTab) => {
        setActiveTab(tab);
    }, []);


    useEffect(() => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');

      if (theme.base === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.add(systemTheme);
      } else {
        root.classList.add(theme.base);
      }
    }, [theme.base]);

    

    const renderTabContent = () => {
        switch (activeTab) {
            case AppTab.CONNECTIONS:
                return <ConnectionPanel />;
            case AppTab.OBS_STUDIO:
                return <ObsStudioTab />;
            case AppTab.GEMINI:
                return (
                    <GeminiChat
                        setErrorMessage={setErrorMessage}
                        chatInputValue={chatInputValue}
                        onChatInputChange={setChatInputValue}
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
                <div className={`h-screen max-h-screen bg-gradient-to-br from-background to-card text-foreground flex flex-col overflow-hidden transition-colors duration-500 ease-in-out`}>
                    <Header headerRef={headerRef} />
                    <div className="flex flex-grow overflow-hidden">
                        <div className={`flex-grow overflow-y-auto px-1 sm:px-2 pb-1 transition-all duration-300 ease-in-out ${flipSides ? 'order-last' : 'order-first'}`}>
                            {renderTabContent()}
                        </div>
                        <div className={`sticky z-10 px-2 pt-2 transition-all duration-300 ease-in-out ${flipSides ? 'order-first' : 'order-last'}`}>
                            <TabNavigation
                                activeTab={activeTab}
                                setActiveTab={handleTabChange}
                                tabOrder={TAB_ORDER}
                            />
                        </div>
                    </div>
                </div>
            </ConnectionProvider>
        </ErrorBoundary>
    );
};

export default App;
