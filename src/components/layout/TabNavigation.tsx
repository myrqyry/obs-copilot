// src/components/layout/TabNavigation.tsx
import React from 'react';
import { AppTab } from '@/types';
import { useChatStore } from '@/store/chatStore';
import { useConnectionManagerStore } from '@/store/connectionManagerStore';


import { CogIcon } from '@/components/common/CogIcon';
import Tooltip from '@/components/ui/Tooltip';
import { cn } from '@/lib/utils';
import { ConnectionStatusIcon } from '@/features/connections/ConnectionStatusIcon';


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
    const connectError = useConnectionManagerStore((state: any) => state.connectError);
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
        <div className="w-14 overflow-hidden rounded-lg shadow-lg flex-shrink-0">
            <div className="py-2 px-1 border border-border bg-gradient-to-b from-background to-card rounded-lg flex flex-col items-center space-y-2">
                <div className="flex flex-col items-center justify-center space-y-1">
                    {tabOrder.map((tab) => {
                        const isActive = activeTab === tab;

                        let iconColorClass = 'text-muted-foreground';
                        if (tab === AppTab.CONNECTIONS) {
                            if (connectionIconStatus === 'connecting') iconColorClass = 'text-yellow-500';
                            else if (connectionIconStatus === 'connected-full') iconColorClass = 'text-green-500';
                            else if (connectionIconStatus === 'connected-obs-only') iconColorClass = 'text-blue-500';
                            else if (connectionIconStatus === 'disconnected') iconColorClass = 'text-destructive';
                        } else if (isActive) {
                            iconColorClass = 'text-primary';
                        } else {
                            iconColorClass = 'text-muted-foreground';
                        }

                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    `flex flex-col items-center justify-center gap-1 p-2 rounded-md font-medium
                                    transition-all duration-300 ease-out relative w-full text-center`,
                                    isActive
                                        ? 'bg-primary/20 text-primary border border-primary/30 shadow-sm'
                                        : 'hover:bg-muted/50 hover:text-foreground text-sm'
                                )}
                                role="tab"
                                aria-selected={isActive}
                                id={`tab-${tab}`}
                                aria-controls={`panel-${tab}`}
                            >
                                <span className={cn(
                                    `${iconColorClass} transition-colors duration-200 text-2xl`,
                                    isActive && 'scale-110'
                                )}>
                                    {tabEmojis[tab]}
                                </span>
                                <span className={`text-xs mt-1 leading-none
                                    ${isActive ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}
                                `}>
                                    {getTabTitle(tab)}
                                </span>
                            </button>
                        );
                    })}
                </div>
                <ConnectionStatusIcon
                    isConnected={isConnected}
                    isConnecting={isConnecting}
                    error={!!connectError}
                    onClick={() => setActiveTab(AppTab.CONNECTIONS)}
                    className="mt-auto"
                />
                <Tooltip content="App Settings" side="left">
                    <button
                        onClick={() => setActiveTab(AppTab.SETTINGS)}
                        className="relative p-2 rounded-full hover:bg-muted focus-ring enhanced-focus transition-all duration-150 ease-in-out"
                        aria-label="Open App Settings"
                    >
                        <CogIcon className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                    </button>
                </Tooltip>
            </div>
        </div>
    );
};
