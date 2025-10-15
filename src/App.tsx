 // src/App.tsx
import React, { Suspense, useRef, useCallback, useEffect } from 'react';
import { gsap } from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
// Import GSAP test for development verification
import './utils/gsapTest';
import ComprehensiveErrorBoundary from './components/common/ComprehensiveErrorBoundary';
import { Header } from './components/layout/Header';
import { TabNavigation } from './components/layout/TabNavigation';
import { TooltipProvider } from "@/components/ui";
import useUiStore from './store/uiStore';
import { usePlugins } from './hooks/usePlugins';
import { useTheme } from './hooks/useTheme';
import TwitchCallback from './features/auth/TwitchCallback';
import useConnectionsStore from './store/connectionsStore';
import { loadConnectionSettings, saveConnectionSettings } from './utils/persistence';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import ConfirmationDialog from './components/common/ConfirmationDialog';
import GlobalErrorDisplay from './components/common/GlobalErrorDisplay';

const App: React.FC = React.memo(() => {
    const plugins = usePlugins();
    const { activeTab, setActiveTab, flipSides } = useUiStore(state => ({
        activeTab: state.activeTab,
        setActiveTab: state.setActiveTab,
        flipSides: state.flipSides,
    }));
    
    const headerRef = useRef<HTMLDivElement>(null);
    
    // Initialize and apply themes
    useTheme();

    const { connectToObs, disconnectFromObs } = useConnectionsStore(state => ({
        connectToObs: state.connectToObs,
        disconnectFromObs: state.disconnectFromObs,
    }));

    const handleTabChange = useCallback((tabId: string) => {
        setActiveTab(tabId);
    }, [setActiveTab]);

    // Auto-Connect on App Load
    useEffect(() => {
        const savedSettings = loadConnectionSettings();
        if (savedSettings.autoConnect && savedSettings.obsUrl) {
            connectToObs(savedSettings.obsUrl, savedSettings.obsPassword);
        }

        return () => {
            disconnectFromObs();
        };
    }, [connectToObs, disconnectFromObs]);
 
     const renderTabContent = () => {
         const activePlugin = plugins.find(p => p.id === activeTab);
         if (activePlugin) {
             const TabComponent = activePlugin.component;
             return (
                <ComprehensiveErrorBoundary>
                    <TabComponent />
                </ComprehensiveErrorBoundary>
            );
         }
         return <div>Select a tab</div>;
     };

     if (window.location.pathname === '/auth/twitch/callback') {
         return <TwitchCallback />;
     }

     return (
         <ComprehensiveErrorBoundary>
            <TooltipProvider>
                <div className={`app-root h-screen max-h-screen bg-gradient-to-br from-background to-card text-foreground flex flex-col transition-colors duration-500 ease-in-out`}>
                    <Header headerRef={headerRef} />
                    <TabNavigation
                        activeTab={activeTab}
                        setActiveTab={handleTabChange}
                        tabs={plugins}
                    />
                    <div className="flex flex-grow overflow-hidden">
                        <div className={`flex-grow overflow-y-auto px-1 sm:px-2 pb-1 transition-all duration-300 ease-in-out ${flipSides ? 'order-last' : 'order-first'}`}>
                            <Suspense fallback={<div className="flex justify-center items-center h-full"><LoadingSpinner /></div>}>
                                {renderTabContent()}
                            </Suspense>
                        </div>
                     </div>
                     <ConfirmationDialog />
                     <GlobalErrorDisplay />
                 </div>
            </TooltipProvider>
         </ComprehensiveErrorBoundary>
     );
 });

 export default App;
