import React, { Suspense } from 'react';
import PluginErrorBoundary from '@/components/common/PluginErrorBoundary';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Plugin } from '@/types/plugin';

interface PluginRendererProps {
    plugin: Plugin | undefined;
    activeTab: string;
    setActiveTab?: (tabId: string) => void;
}

const PluginNotFound: React.FC<{ tabId: string }> = ({ tabId }) => (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground" role="alert">
        <p className="text-lg font-medium">No plugin found for tab: {tabId}</p>
        <p className="text-sm mt-2">Please select a different tab from the navigation</p>
    </div>
);

const PluginConfigError: React.FC<{ tabId: string; onRecover?: (() => void) | undefined }> = ({ tabId, onRecover }) => (
    <div className="flex flex-col items-center justify-center h-full text-destructive" role="alert">
        <p className="text-lg font-semibold">Plugin Configuration Error</p>
        <p className="text-sm mt-2 text-muted-foreground">
            Plugin <code className="px-1 py-0.5 bg-muted rounded">{tabId}</code> has no component defined.
        </p>
        {onRecover && (
            <button 
                onClick={onRecover}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
                Go to Dashboard
            </button>
        )}
    </div>
);

export const PluginRenderer: React.FC<PluginRendererProps> = ({ plugin, activeTab, setActiveTab }) => {
    if (!plugin) {
        return <PluginNotFound tabId={activeTab} />;
    }

    const TabComponent = plugin.component;

    if (!TabComponent) {
        return (
            <PluginConfigError 
                tabId={activeTab} 
                onRecover={setActiveTab ? () => setActiveTab('dashboard') : undefined} 
            />
        );
    }

    return (
        <PluginErrorBoundary pluginId={plugin.id}>
            <Suspense 
                fallback={
                    <div className="flex flex-col justify-center items-center h-full gap-3">
                        <LoadingSpinner size="medium" />
                        <p className="text-sm text-muted-foreground">Loading {plugin.name || activeTab}...</p>
                    </div>
                }
            >
                <TabComponent />
            </Suspense>
        </PluginErrorBoundary>
    );
};
