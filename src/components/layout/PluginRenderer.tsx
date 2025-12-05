import React, { Suspense } from 'react';
import { PluginErrorBoundary } from '@/components/common/PluginErrorBoundary';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Plugin } from '@/types/plugin';
import { useAppLayout } from '@/hooks/useAppLayout';
import { AlertTriangle } from 'lucide-react';
import { pluginManager } from '@/plugins';

interface PluginRendererProps {
    plugin: Plugin | undefined;
}

const PluginNotFound: React.FC<{ tabId: string; onRecover: () => void }> = ({ tabId, onRecover }) => (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground" role="alert">
        <AlertTriangle className="w-16 h-16 mb-4 text-amber-500" />
        <p className="text-lg font-medium">No plugin found for tab: {tabId}</p>
        <p className="text-sm mt-2 mb-4">This tab may have been disabled or removed</p>
        <button 
            onClick={onRecover}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
            Return to Dashboard
        </button>
    </div>
);

const PluginConfigError: React.FC<{ tabId: string; onRecover: () => void }> = ({ tabId, onRecover }) => (
    <div className="flex flex-col items-center justify-center h-full text-destructive" role="alert">
        <AlertTriangle className="w-16 h-16 mb-4" />
        <p className="text-lg font-semibold">Plugin Configuration Error</p>
        <p className="text-sm mt-2 text-muted-foreground">
            Plugin <code className="px-1 py-0.5 bg-muted rounded text-xs font-mono">{tabId}</code> has no component defined.
        </p>
        <button 
            onClick={onRecover}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
            Go to Dashboard
        </button>
    </div>
);

export const PluginRenderer: React.FC<PluginRendererProps> = ({ plugin }) => {
    const { activeTab, setActiveTab } = useAppLayout();

    const handleRecover = () => {
        setActiveTab('dashboard');
    };

    if (!plugin) {
        return <PluginNotFound tabId={activeTab} onRecover={handleRecover} />;
    }

    const TabComponent = plugin.component;

    if (!TabComponent) {
        return <PluginConfigError tabId={activeTab} onRecover={handleRecover} />;
    }

    return (
        <PluginErrorBoundary pluginName={plugin.name}>
            <Suspense 
                fallback={
                    <div className="flex flex-col justify-center items-center h-full gap-3" role="status">
                        <LoadingSpinner size="medium" />
                        <p className="text-sm text-muted-foreground">
                            Loading {plugin.name || activeTab}...
                        </p>
                        <span className="sr-only">Loading plugin</span>
                    </div>
                }
            >
                <TabComponent context={pluginManager.getContext()} />
            </Suspense>
        </PluginErrorBoundary>
    );
};