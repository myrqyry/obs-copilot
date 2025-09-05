// src/App.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import ErrorBoundary from './components/common/ErrorBoundary';
import { Header } from './components/layout/Header';
import { TabNavigation } from './components/layout/TabNavigation';
import { ConnectionProvider } from './features/connections/ConnectionProvider';
import useSettingsStore from './store/settingsStore';
import { allPlugins } from './plugins';

// Register GSAP plugins for animations
try {
  gsap.registerPlugin(MorphSVGPlugin);
} catch (error) {
  console.warn('GSAP plugin registration failed:', error);
}

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState<string>('gemini');
    
    const headerRef = useRef<HTMLDivElement>(null);
    const { theme, flipSides } = useSettingsStore();

    const handleTabChange = useCallback((tabId: string) => {
        setActiveTab(tabId);
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
        const activePlugin = allPlugins.find(p => p.id === activeTab);
        if (activePlugin) {
            const TabComponent = activePlugin.component;
            return <TabComponent />;
        }
        return <div>Select a tab</div>;
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
                                tabs={allPlugins}
                            />
                        </div>
                    </div>
                </div>
            </ConnectionProvider>
        </ErrorBoundary>
    );
};

export default App;
