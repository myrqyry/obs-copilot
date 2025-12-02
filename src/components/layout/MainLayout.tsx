import React, { useRef } from 'react';
import { Header } from '@/components/layout/Header';
import { TabNavigation } from '@/components/layout/TabNavigation';
import { PluginRenderer } from '@/components/layout/PluginRenderer';
import ConfirmationDialog from '@/components/common/ConfirmationDialog';
import GlobalErrorDisplay from '@/components/common/GlobalErrorDisplay';
import { AppInitializer } from '@/components/common/AppInitializer';
import { usePlugins } from '@/hooks/usePlugins';
import { useTheme } from '@/hooks/useTheme';
import { useAppInitialization } from '@/hooks/useAppInitialization';
import { useAppLayout } from '@/hooks/useAppLayout';

const MainLayout: React.FC = () => {
    const plugins = usePlugins();
    const { 
        activeTab, 
        setActiveTab, 
        layoutClasses, 
        getContentOrderClass 
    } = useAppLayout();
    
    const headerRef = useRef<HTMLDivElement>(null);
    
    useTheme();
    const { isInitialized, initError, retryInit, stepLabel, progress } = useAppInitialization();
    const activePlugin = plugins.find(p => p.id === activeTab);

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
                <ConfirmationDialog />
                <GlobalErrorDisplay />
            </div>
        </AppInitializer>
    );
};

export default MainLayout;
