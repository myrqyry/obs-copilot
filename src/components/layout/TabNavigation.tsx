// src/components/layout/TabNavigation.tsx
import React from 'react';
import { AppTab } from '@/types';
import { useChatStore } from '@/store/chatStore';
import { useConnectionManagerStore } from '@/store/connectionManagerStore';

import { AnimatedTitleLogos } from '@/components/common/AnimatedTitleLogos';
import { CogIcon } from '@/components/common/CogIcon';
import Tooltip from '@/components/ui/Tooltip';
import { cn } from '@/lib/utils';
import { ConnectionStatusIcon } from '@/features/connections/ConnectionStatusIcon';
import { useSettingsStore } from '@/store/settingsStore'; // Import useSettingsStore to get theme data

interface TabNavigationProps {
    activeTab: AppTab;
    setActiveTab: (tab: AppTab) => void;
    headerRef: React.RefObject<HTMLDivElement>;
    headerHeight: number;
    children: React.ReactNode;
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
    headerRef,
    headerHeight,
    children,
}) => {
    // Corrected state retrieval from useConnectionManagerStore and useChatStore
    const isConnected = useConnectionManagerStore((state: any) => state.isConnected);
    const isConnecting = useConnectionManagerStore((state: any) => state.isConnecting);
    const connectError = useConnectionManagerStore((state: any) => state.connectError);
    const isGeminiClientInitialized = useChatStore((state: any) => state.isGeminiClientInitialized);

    // Get theme colors from settings store
    const theme = useSettingsStore((state: any) => state.theme);

    // Defensive defaults to avoid throws during render if theme isn't loaded yet
    const accentColor = theme?.accent ?? 'mauve';
    const secondaryAccentColor = theme?.secondaryAccent ?? 'flamingo';


    const tabOrder: AppTab[] = [
        AppTab.GEMINI,
        AppTab.OBS_STUDIO,
        AppTab.STREAMING_ASSETS,
        AppTab.CREATE,
        AppTab.SETTINGS,
        AppTab.CONNECTIONS,
        AppTab.ADVANCED,
    ];

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

    const getMobileTabTitle = (tabName: AppTab) => {
        switch (tabName) {
            case AppTab.GEMINI:
                return 'Assistant';
            case AppTab.OBS_STUDIO:
                return 'OBS Studio';
            case AppTab.STREAMING_ASSETS:
                return 'Assets';
            case AppTab.CREATE:
                return 'Create';
            case AppTab.SETTINGS:
                return 'Settings';
            case AppTab.CONNECTIONS:
                return 'Connect';
            case AppTab.ADVANCED:
                return 'Advanced';
            default:
                return tabName;
        }
    };

    return (
        <div className="h-screen max-h-screen bg-gradient-to-br from-background to-card text-foreground flex flex-col overflow-hidden">
            <header ref={headerRef} className="sticky top-0 z-20 bg-background p-2 shadow-sm h-12 flex justify-center items-center">
                <AnimatedTitleLogos 
                    accentColor={accentColor} 
                    secondaryAccentColor={secondaryAccentColor} 
                />
            </header>

            <div className="sticky z-10 px-1 pt-1" style={{ top: `${headerHeight}px` }}>
                <div className="py-1 px-3 border-b border-border text-base font-semibold emoji-text bg-background rounded-t-lg font-sans text-primary shadow-sm">
                    <div className="flex items-center justify-center gap-1 min-w-0">
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
                                        `flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 rounded-md font-medium
                                        transition-all duration-300 ease-out relative whitespace-nowrap`,
                                        isActive
                                            ? 'bg-primary/20 text-primary border border-primary/30 shadow-sm text-base'
                                            : 'hover:bg-muted/50 hover:text-foreground text-sm'
                                    )}
                                    role="tab"
                                    aria-selected={isActive}
                                    id={`tab-${tab}`}
                                    aria-controls={`panel-${tab}`}
                                >
                                    <span className={cn(
                                        `${iconColorClass} transition-colors duration-200`,
                                        isActive && 'scale-110' // Subtle animation for active icon
                                    )}>
                                        {tabEmojis[tab]}
                                    </span>
                                    <span className={`
                                        transition-all duration-300 overflow-hidden text-sm sm:text-base
                                        ${isActive ? 'max-w-24 sm:max-w-48 opacity-100' : 'max-w-0 opacity-0'}
                                    `}>
                                        <span className="hidden md:inline">{getTabTitle(tab)}</span>
                                        <span className="inline md:hidden">{getMobileTabTitle(tab)}</span>
                                    </span>
                                </button>
                            );
                        })}
                        <ConnectionStatusIcon
                            isConnected={isConnected}
                            isConnecting={isConnecting}
                            error={!!connectError}
                            onClick={() => {
                                setActiveTab(AppTab.CONNECTIONS);
                            }}
                        />
                        <Tooltip content="App Settings">
                            <button
                                onClick={() => setActiveTab(AppTab.SETTINGS)}
                                className="relative p-2 rounded-full hover:bg-muted focus-ring enhanced-focus transition-all duration-150 ease-in-out ml-2"
                                aria-label="Open App Settings"
                            >
                                <CogIcon className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                            </button>
                        </Tooltip>
                    </div>
                </div>
            </div>

            <main className="flex-grow overflow-y-auto px-1 pb-1 transition-all duration-300 ease-in-out">
                {(() => {
                    try {
                        return children;
                    } catch (e) {
                        console.error('Error rendering tab content:', e);
                        return <div className="p-4 text-destructive">Error rendering tab content</div>;
                    }
                })()}
            </main>
        </div>
    );
};
