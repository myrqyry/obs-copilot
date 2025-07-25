import React from 'react';
import { AppTab } from '../../types';
import { useConnectionStore } from '../../store/connectionStore';
import { useChatStore } from '../../store/chatStore';

interface TabNavigationProps {
    activeTab: AppTab;
    setActiveTab: (tab: AppTab) => void;
    tabOrder: AppTab[];
}

const tabEmojis: Record<AppTab, string> = {
    [AppTab.GEMINI]: '🤖',
    [AppTab.OBS_STUDIO]: '🎬',
    [AppTab.STREAMING_ASSETS]: '🌈',
    [AppTab.CREATE]: '✨',
    [AppTab.SETTINGS]: '⚙️',
    [AppTab.CONNECTIONS]: '🔌',
    [AppTab.ADVANCED]: '🛠️',
};

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, setActiveTab, tabOrder }) => {
    const { isConnected, isConnecting } = useConnectionStore();
    const { isGeminiClientInitialized } = useChatStore();

    return (
        <div role="tablist" aria-label="Main application tabs" className="py-2 px-4 border-b border-border text-sm font-semibold emoji-text bg-background rounded-t-lg font-sans text-primary shadow-md">
            <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2 min-w-0">
                {tabOrder.map((tab, index) => {
                    const isActive = activeTab === tab;
                    let iconColor = 'text-muted-foreground';
                    const isConnectionsTab = tab === AppTab.CONNECTIONS;
                    if (isConnectionsTab) {
                        if (isConnecting) {
                            iconColor = 'text-yellow-500';
                        } else if (isConnected && isGeminiClientInitialized) {
                            iconColor = 'text-green-500';
                        } else if (isConnected) {
                            iconColor = 'text-blue-500';
                        } else {
                            iconColor = 'text-destructive';
                        }
                    } else if (isActive) {
                        iconColor = 'text-primary';
                    }

                    return (
                        <button
                            key={tab}
                            role="tab"
                            aria-selected={isActive.toString()}
                            id={`tab-${tab}`}
                            onClick={() => setActiveTab(tab)}
                            className={`flex items-center gap-1 xs:gap-0 sm:gap-1 px-2 xs:px-1.5 sm:px-3 py-1.5 sm:py-2 rounded-md font-medium transition-all duration-300 ease-out relative whitespace-nowrap hover:bg-muted/50 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 focus:ring-offset-background ${isActive ? 'bg-primary/20 text-primary border border-primary/30 shadow-sm text-xs sm:text-sm' : 'text-muted-foreground text-xs sm:text-sm'}`}
                            title={tab}
                        >
                            <span className={`text-sm xs:text-base sm:text-lg ${iconColor} transition-colors duration-200`}>
                                {tabEmojis[tab]}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
