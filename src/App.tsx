 // src/App.tsx
import React, { Suspense, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
// Import GSAP test for development verification
import './utils/gsapTest';
import ComprehensiveErrorBoundary from './components/common/ComprehensiveErrorBoundary';
import { Header } from './components/layout/Header';
import { TabNavigation } from './components/layout/TabNavigation';
import { TooltipProvider } from "@/components/ui";
import { ConnectionProvider } from './features/connections/ConnectionProvider';
import useSettingsStore from './store/settingsStore';
import { usePlugins } from './hooks/usePlugins';
import { useTheme } from './hooks/useTheme';
import TwitchCallback from './features/auth/TwitchCallback';
import { LoadingSpinner } from './components/common/LoadingSpinner';

const App: React.FC = React.memo(() => {
    const plugins = usePlugins();
    const [activeTab, setActiveTab] = useState<string>('gemini');
    
    const headerRef = useRef<HTMLDivElement>(null);
    const flipSides = useSettingsStore((state) => state.flipSides);
    
    // Initialize and apply themes
    useTheme();

    const handleTabChange = useCallback((tabId: string) => {
        setActiveTab(tabId);
    }, []);
 
     const renderTabContent = () => {
         const activePlugin = plugins.find(p => p.id === activeTab);
         if (activePlugin) {
             const TabComponent = activePlugin.component;
             return <TabComponent />;
         }
         return <div>Select a tab</div>;
     };

     if (window.location.pathname === '/auth/twitch/callback') {
         return <TwitchCallback />;
     }

     return (
         <ComprehensiveErrorBoundary>
            <TooltipProvider>
                <ConnectionProvider>
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
                     </div>
                </ConnectionProvider>
            </TooltipProvider>
         </ComprehensiveErrorBoundary>
     );
 };

 export default App;
