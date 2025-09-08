 // src/App.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
// Import GSAP test for development verification
import './utils/gsapTest';
import ComprehensiveErrorBoundary from './components/common/ComprehensiveErrorBoundary';
import { Header } from './components/layout/Header';
import { TabNavigation } from './components/layout/TabNavigation';
import { ConnectionProvider } from './features/connections/ConnectionProvider';
import useSettingsStore from './store/settingsStore';
import { usePlugins } from './hooks/usePlugins';
import { useTheme } from './hooks/useTheme'; // Register GSAP plugins for animations
 try {
   gsap.registerPlugin(MorphSVGPlugin);
 } catch (error) {
   console.warn('GSAP plugin registration failed:', error);
 }

 import TwitchCallback from './features/auth/TwitchCallback';

const App: React.FC = () => {
    const plugins = usePlugins();
    const [activeTab, setActiveTab] = useState<string>('gemini');
    
    const headerRef = useRef<HTMLDivElement>(null);
    const theme = useSettingsStore((state) => state.theme);
    const flipSides = useSettingsStore((state) => state.flipSides);
    
    // Initialize and apply themes
    useTheme();

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
         // Ensure theme.base is a string before adding it
         if (typeof theme.base === 'string') {
           root.classList.add(theme.base);
         }
       }
     }, [theme.base]);

     
 
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
                             {renderTabContent()}
                         </div>
                     </div>
                 </div>
             </ConnectionProvider>
         </ComprehensiveErrorBoundary>
     );
 };

 export default App;