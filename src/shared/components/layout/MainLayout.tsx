import React, { useRef } from 'react';
import { Header } from '@/shared/components/layout/Header';
import { TabNavigation } from '@/shared/components/layout/TabNavigation';
import { PluginRenderer } from '@/shared/components/layout/PluginRenderer';
import ConfirmationDialog from '@/shared/components/common/ConfirmationDialog';
import GlobalErrorDisplay from '@/shared/components/common/GlobalErrorDisplay';
import { AppInitializer } from '@/shared/components/common/AppInitializer';
import { Footer } from '@/shared/components/layout/Footer';
import { usePlugins } from '@/shared/hooks/usePlugins';
import { useTheme } from '@/shared/hooks/useTheme';
import { useAppInitialization } from '@/shared/hooks/useAppInitialization';
import { useAppLayout } from '@/shared/hooks/useAppLayout';
import { useKeyboardShortcuts } from '@/shared/hooks/useKeyboardShortcuts';
import { useConnectionNotifications } from '@/shared/hooks/useConnectionNotifications';
import { Toaster } from 'sonner';

const MainLayout: React.FC = () => {
    // Initialize global connection notifications
    useConnectionNotifications();

    // Initialize keyboard shortcuts
    useKeyboardShortcuts();

    const { plugins, isLoading: pluginsLoading, error: pluginsError } = usePlugins();
    const { 
        activeTab, 
        layoutClasses, 
        getContentOrderClass 
    } = useAppLayout();
    
    const headerRef = useRef<HTMLDivElement>(null);
    
    useTheme();
    const { isInitialized, initError, retryInit, stepLabel, progress } = useAppInitialization();
    const activePlugin = plugins?.find(p => p.id === activeTab);

    return (
        <AppInitializer 
            isInitialized={isInitialized} 
            error={initError}
            onRetry={retryInit}
            stepLabel={stepLabel}
            progress={progress}
        >
            <div className={layoutClasses.container}>
                <Header headerRef={headerRef} />
                <TabNavigation
                    tabs={plugins}
                />
                <div className="flex flex-grow overflow-hidden">
                    <div className={`${layoutClasses.content} ${getContentOrderClass()}`}>
                        <PluginRenderer 
                            plugin={activePlugin} 
                        />
                    </div>
                </div>
                <Footer />
                <ConfirmationDialog />
                <GlobalErrorDisplay />
                <Toaster theme={useTheme().theme?.mode || 'system'} richColors position="bottom-right" />
            </div>
        </AppInitializer>
    );
};

export default MainLayout;
