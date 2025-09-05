// src/components/layout/TabNavigation.tsx
import React from 'react';
import { useChatStore } from '@/store/chatStore';
import { useConnectionManagerStore } from '@/store/connectionManagerStore';
import { cn } from '@/lib/utils';
import { TabPlugin } from '@/types/plugins';
import { useAnimatedTabs } from '@/hooks/useAnimatedTabs';

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

    const { tabBarRef, registerTab, handleTabClick } = useAnimatedTabs(activeTab);

    const connectionIconStatus = (() => {
        if (isConnecting) return 'connecting';
        if (isConnected && isGeminiClientInitialized) return 'connected-full';
        if (isConnected) return 'connected-obs-only';
        return 'disconnected';
    })();

    return (
        <nav
            ref={tabBarRef}
            className={cn(
                'relative z-40 flex h-12 w-full items-center justify-between border-b bg-card/80 px-4 shadow-md backdrop-blur-md',
                // This will create a pseudo-element for the indicator
                'before:absolute before:bottom-0 before:left-[var(--indicator-left,0px)] before:h-[3px] before:w-[var(--indicator-width,0px)] before:rounded-full before:bg-primary before:opacity-[var(--indicator-opacity,0)] before:transition-[width,transform,opacity] before:duration-300 before:ease-in-out',
                // Glow effect for the indicator
                'before:shadow-[0_0_8px_var(--primary)] before:transition-shadow before:duration-300',
                'before:hover:shadow-[0_0_12px_var(--primary),0_0_24px_var(--primary)]',
                // Interacting state for more prominent glow
                '[&.interacting::before]:shadow-[0_0_12px_var(--primary),0_0_24px_var(--primary),0_0_36px_var(--primary)]',
            )}
            aria-label="Primary"
        >
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
                        ref={(el) => registerTab(tab.id, el)}
                        onClick={handleTabClick(tab.id, setActiveTab)}
                        role="tab"
                        aria-selected={isActive}
                        data-active={isActive}
                        id={`mobile-tab-${tab.id}`}
                        aria-controls={`panel-${tab.id}`}
                        className={cn(
                            'tab-item flex-1 flex flex-col items-center justify-center gap-0 p-1 rounded-lg transition-colors duration-200 relative z-10',
                            'text-muted-foreground data-[active=true]:text-primary', // Use data-active for text color
                            'hover:bg-muted/30',
                            // Active state styles, not relying on class
                            'data-[active=true]:bg-primary/10',
                            // Ripple effect on click
                            'ripple-effect overflow-hidden',
                            '[&.ripple]:before:content-[""] [&.ripple]:before:block [&.ripple]:before:absolute [&.ripple]:before:w-full [&.ripple]:before:h-full [&.ripple]:before:rounded-full [&.ripple]:before:bg-primary [&.ripple]:before:scale-0 [&.ripple]:before:animate-ripple [&.ripple]:before:opacity-0',
                        )}
                    >
                        <Icon className={cn(`${iconColorClass} text-2xl`)} />
                        <span className="mt-1 text-[10px] text-muted-foreground data-[active=true]:text-primary data-[active=true]:text-xs">
                            {tab.name.split(' ')[0]}
                        </span>
                    </button>
                );
            })}
        </nav>
    );
};
