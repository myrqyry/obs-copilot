import React, { Suspense, useRef, useCallback } from 'react';
import ComprehensiveErrorBoundary from '@/components/common/ComprehensiveErrorBoundary';
import { Header } from '@/components/layout/Header';
import { TabNavigation } from '@/components/layout/TabNavigation';
import { TooltipProvider } from "@/components/ui";
import { useUiStore } from '@/store';
import { usePlugins } from '@/hooks/usePlugins';
import { useTheme } from '@/hooks/useTheme';
import { useAppInitialization } from '@/hooks/useAppInitialization';
import TwitchCallback from '@/features/auth/TwitchCallback';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import ConfirmationDialog from '@/components/common/ConfirmationDialog';
import GlobalErrorDisplay from '@/components/common/GlobalErrorDisplay';

const App: React.FC = React.memo(() => {
    const plugins = usePlugins();
    const activeTab = useUiStore(state => state.activeTab);
    const setActiveTab = useUiStore(state => state.setActiveTab);
    const flipSides = useUiStore(state => state.flipSides);
    
    const headerRef = useRef<HTMLDivElement>(null);
    
    // Initialize and apply themes
    useTheme();

    // App Initialization (Connection & Loading State)
    const { isInitialized, initError } = useAppInitialization();

    const handleTabChange = useCallback((tabId: string) => {
        setActiveTab(tabId);
    }, [setActiveTab]);
 
     const renderTabContent = () => {
        try {
            const activePlugin = plugins.find(p => p.id === activeTab);

            if (!activePlugin) {
                return (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <p className="text-lg">No plugin found for tab: {activeTab}</p>
                        <p className="text-sm mt-2">Please select a different tab</p>
                    </div>
                );
            }

            const TabComponent = activePlugin.component;

            if (!TabComponent) {
                throw new Error(`Plugin ${activeTab} has no component`);
            }

            return (
                <ComprehensiveErrorBoundary>
                    <TabComponent />
                </ComprehensiveErrorBoundary>
            );
        } catch (error) {
            console.error('Error rendering tab content:', error);
            return (
                <div className="flex flex-col items-center justify-center h-full text-destructive">
                    <p className="text-lg">Failed to load tab content</p>
                    <p className="text-sm mt-2">{error instanceof Error ? error.message : 'Unknown error'}</p>
                </div>
            );
        }
     };

     if (window.location.pathname === '/auth/twitch/callback') {
         return <TwitchCallback />;
     }

    if (!isInitialized) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-background to-card">
                <div className="text-center">
                    <LoadingSpinner size="large" />
                    <p className="mt-4 text-muted-foreground">Initializing OBS Copilot...</p>
                </div>
            </div>
        );
    }

    if (initError) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-background to-card">
                <div className="text-center text-destructive">
                    <p className="text-lg font-semibold">Initialization Failed</p>
                    <p className="mt-2 text-sm">{initError.message}</p>
                </div>
            </div>
        );
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
