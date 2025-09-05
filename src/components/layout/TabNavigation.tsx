// src/components/layout/TabNavigation.tsx
import React from 'react';
import { useChatStore } from '@/store/chatStore';
import { useConnectionManagerStore } from '@/store/connectionManagerStore';
import { cn } from '@/lib/utils';
import { TabPlugin } from '@/types/plugins';

interface TabNavigationProps {
    activeTab: string;
    setActiveTab: (tabId: string) => void;
    tabs: TabPlugin[];
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
    activeTab,
    setActiveTab,
    tabs,
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

    return (
        <nav
            className="fixed bottom-3 left-1/2 transform -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-3xl"
            aria-label="Primary"
        >
            <div className="bg-card/80 backdrop-blur-md border border-border rounded-2xl shadow-lg px-3 py-2 flex items-center justify-between">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    let iconColorClass = isActive ? 'text-primary' : 'text-muted-foreground';
                    if (tab.id === 'connections') {
                        if (connectionIconStatus === 'connecting') iconColorClass = 'text-yellow-500';
                        else if (connectionIconStatus === 'connected-full') iconColorClass = 'text-green-500';
                        else if (connectionIconStatus === 'connected-obs-only') iconColorClass = 'text-info';
                        else if (connectionIconStatus === 'disconnected') iconColorClass = 'text-destructive';
                    }
                    const Icon = tab.icon;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            role="tab"
                            aria-selected={isActive}
                            id={`mobile-tab-${tab.id}`}
                            aria-controls={`panel-${tab.id}`}
                            className={cn(
                                'flex-1 flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors duration-200',
                                isActive ? 'bg-primary/10' : 'hover:bg-muted/30'
                            )}
                        >
                            <Icon className={cn(`${iconColorClass} text-2xl`)} />
                            <span className={`text-[10px] mt-1 ${isActive ? 'text-primary' : 'text-xs text-muted-foreground'}`}>
                                {tab.name.split(' ')[0]}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};
