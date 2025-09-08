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
                // Enhanced gradient border on top for visual appeal
                'before:absolute before:top-0 before:left-0 before:w-full before:h-[2px] before:bg-gradient-to-r before:from-primary/60 before:via-accent/40 before:to-primary/60',
                // Active tab indicator with enhanced styling
                'after:absolute after:bottom-0 after:left-[var(--indicator-left,0px)] after:h-[3px] after:w-[var(--indicator-width,0px)] after:rounded-full after:bg-gradient-to-r after:from-primary after:to-accent after:opacity-[var(--indicator-opacity,0)] after:transition-[width,transform,opacity] after:duration-300 after:ease-in-out',
                // Enhanced glow effect for the indicator
                'after:shadow-[0_0_12px_var(--primary),0_0_6px_var(--accent)] after:transition-shadow after:duration-300',
                'after:hover:shadow-[0_0_16px_var(--primary),0_0_8px_var(--accent),0_0_24px_var(--primary)]',
                // Interacting state with more prominent dual-color glow
                '[&.interacting::after]:shadow-[0_0_20px_var(--primary),0_0_12px_var(--accent),0_0_36px_var(--primary)]',
            )}
            aria-label="Primary"
        >
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                let iconColorClass = isActive ? 'text-primary' : 'text-muted-foreground';
                if (tab.id === 'connections') {
                    if (connectionIconStatus === 'connecting') iconColorClass = 'text-warning';
                    else if (connectionIconStatus === 'connected-full') iconColorClass = 'text-accent';
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
                            'tab-item flex-1 flex flex-col items-center justify-center gap-0 p-1 rounded-lg transition-all duration-200 relative z-10',
                            // Enhanced text colors with secondary accent for subtle contrast
                            'text-muted-foreground data-[active=true]:text-primary hover:text-accent',
                            // Enhanced hover state with gradient background
                            'hover:bg-gradient-to-br hover:from-muted/20 hover:to-accent/10 hover:shadow-sm',
                            // Enhanced active state with primary and accent colors
                            'data-[active=true]:bg-gradient-to-br data-[active=true]:from-primary/15 data-[active=true]:to-accent/10',
                            'data-[active=true]:shadow-inner data-[active=true]:border data-[active=true]:border-primary/20',
                            // Enhanced ripple effect with accent color
                            'ripple-effect overflow-hidden',
                            '[&.ripple]:before:content-[""] [&.ripple]:before:block [&.ripple]:before:absolute [&.ripple]:before:w-full [&.ripple]:before:h-full [&.ripple]:before:rounded-full [&.ripple]:before:bg-gradient-to-r [&.ripple]:before:from-primary [&.ripple]:before:to-accent [&.ripple]:before:scale-0 [&.ripple]:before:animate-ripple [&.ripple]:before:opacity-0',
                        )}
                    >
                        <Icon className={cn(`${iconColorClass} text-2xl`)} />
                        <span className="mt-1 text-[10px] text-muted-foreground data-[active=true]:text-primary data-[active=true]:text-xs hover:text-accent transition-colors duration-200 font-medium">
                            {tab.name.split(' ')[0]}
                        </span>
                    </button>
                );
            })}
        </nav>
    );
};
