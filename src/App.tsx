import React, { useState, useEffect, useRef } from 'react';
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
import { gsap } from 'gsap';
import MiniPlayer from './components/common/MiniPlayer';
import { NotificationManager } from './components/common/NotificationManager';
import { ConnectionProvider } from './components/ConnectionProvider';
import { ConnectionPanel } from './features/connections/ConnectionPanel';

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

    const tabComponents: Record<AppTab, React.ReactNode> = {
        [AppTab.CONNECTIONS]: <ConnectionPanel />,
        [AppTab.OBS_STUDIO]: <ObsMainControls />,
        [AppTab.SETTINGS]: <ObsSettingsPanel />,
        [AppTab.ADVANCED]: <AdvancedPanel />,
        [AppTab.GEMINI]: <GeminiChat />,
        [AppTab.STREAMING_ASSETS]: <StreamingAssetsTab />,
        [AppTab.CREATE]: <CreateTab />,
    };

    return (
        <ErrorBoundary>
            <ConnectionProvider>
                <div className="h-screen max-h-screen bg-gradient-to-br from-background to-card text-foreground flex flex-col overflow-hidden">
                    <Header headerRef={headerRef} />
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
