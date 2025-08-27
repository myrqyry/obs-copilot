import React, { useState, useRef, useCallback, useEffect } from 'react';
import { gsap } from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import ErrorBoundary from './components/common/ErrorBoundary';
import { Header } from './components/layout/Header';
import { TabNavigation } from './components/layout/TabNavigation';
import { AppTab } from './types';
import { ConnectionProvider } from './components/ConnectionProvider';
import { useOnRefreshData } from './hooks/useOptimizedStoreSelectors';

// Register GSAP plugins
try {
  gsap.registerPlugin(MorphSVGPlugin);
} catch (error) {
  console.warn('GSAP plugin registration failed:', error);
}

// Memoize tab order to prevent unnecessary re-renders
const TAB_ORDER: AppTab[] = [AppTab.GEMINI];

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState<AppTab>(AppTab.GEMINI);
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
                        <div className="p-4">
                            <h2 className="text-xl font-semibold mb-2">OBS Copilot</h2>
                            <p>Application is running in simplified mode.</p>
                        </div>
                    </main>
                </div>
            </ConnectionProvider>
        </ErrorBoundary>
    );
};

export default App;
