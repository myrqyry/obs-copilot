// src/components/layout/TabNavigation.tsx
import React from 'react';
import { AppTab } from '@/types';
import { useChatStore } from '@/store/chatStore';
import { useConnectionManagerStore } from '@/store/connectionManagerStore';


import { cn } from '@/lib/utils';


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

export const TabNavigation: React.FC<TabNavigationProps> = ({
    activeTab,
    setActiveTab,
    tabOrder,
}) => {
    const isConnected = useConnectionManagerStore((state: any) => state.isConnected);
    const isConnecting = useConnectionManagerStore((state: any) => state.isConnecting);
    const isGeminiClientInitialized = useChatStore((state: any) => state.isGeminiClientInitialized);

    

    const connectionIconStatus = (() => {
        if (isConnecting) return 'connecting';
        if (isConnected && isGeminiClientInitialized) return 'connected-full';
        if (isConnected) return 'connected-obs-only';
        return 'disconnected';
    })();

    const getTabTitle = (tabName: AppTab) => {
        switch (tabName) {
            case AppTab.GEMINI:
                return 'Assistant';
            case AppTab.OBS_STUDIO:
                return 'OBS Studio Controls';
            case AppTab.STREAMING_ASSETS:
                return 'Streaming Assets';
            case AppTab.CREATE:
                return 'Create';
            case AppTab.SETTINGS:
                return 'Settings & Preferences';
            case AppTab.CONNECTIONS:
                return 'Connection Manager';
            case AppTab.ADVANCED:
                return 'Advanced';
            default:
                return tabName;
        }
    };

    return (
        <nav
            className="fixed bottom-3 left-1/2 transform -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-3xl"
            aria-label="Primary"
        >
            <div className="bg-card/80 backdrop-blur-md border border-border rounded-2xl shadow-lg px-3 py-2 flex items-center justify-between">
                {tabOrder.map((tab) => {
                    const isActive = activeTab === tab;
                    let iconColorClass = isActive ? 'text-primary' : 'text-muted-foreground';
                    if (tab === AppTab.CONNECTIONS) {
                        if (connectionIconStatus === 'connecting') iconColorClass = 'text-yellow-500';
                        else if (connectionIconStatus === 'connected-full') iconColorClass = 'text-green-500';
                        else if (connectionIconStatus === 'connected-obs-only') iconColorClass = 'text-info';
                        else if (connectionIconStatus === 'disconnected') iconColorClass = 'text-destructive';
                    }

                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            role="tab"
                            aria-selected={isActive}
                            id={`mobile-tab-${tab}`}
                            aria-controls={`panel-${tab}`}
                            className={cn(
                                'flex-1 flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors duration-200',
                                isActive ? 'bg-primary/10' : 'hover:bg-muted/30'
                            )}
                        >
                            <span className={cn(`${iconColorClass} text-2xl`)}>{tabEmojis[tab]}</span>
                            <span className={`text-[10px] mt-1 ${isActive ? 'text-primary' : 'text-xs text-muted-foreground'}`}>
                                {getTabTitle(tab).split(' ')[0]}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};
