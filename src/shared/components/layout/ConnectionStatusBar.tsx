import React from 'react';
import { useConnectionsStore } from '@/store/connections';
import { useSettingsStore } from '@/store/settingsStore';
import { obsClient } from '@/services/obsClient';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipProvider } from '@/components/ui/tooltip';

export const ConnectionStatusBar: React.FC = () => {
    const obsStatus = useConnectionsStore((state) => state.obsStatus);
    const obsError = useConnectionsStore((state) => state.connectionError);
    // obsLastChecked is not available in the current store implementation
    
    const backendStatus = useConnectionsStore((state) => state.backendStatus);
    const backendError = useConnectionsStore((state) => state.backendError);
    const backendLastChecked = useConnectionsStore((state) => state.backendLastChecked);

    const isStreamerBotConnected = useConnectionsStore((state) => state.isStreamerBotConnected);
    const streamerBotError = useConnectionsStore((state) => state.streamerBotConnectionError);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'connected': return 'text-green-500 bg-green-500/10 border-green-500/20';
            case 'connecting':
            case 'reconnecting': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            case 'error':
            case 'disconnected':
            default: return 'text-red-500 bg-red-500/10 border-red-500/20';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'connected': return <Wifi className="w-3.5 h-3.5" />;
            case 'connecting':
            case 'reconnecting': return <RefreshCw className="w-3.5 h-3.5 animate-spin" />;
            default: return <WifiOff className="w-3.5 h-3.5" />;
        }
    };

    const handleObsReconnect = async () => {
        const settings = useSettingsStore.getState().settings;
        try {
            await obsClient.connect(
                `ws://${settings.obs.url}:${settings.obs.port}`,
                settings.obs.password
            );
        } catch (error) {
            console.error('Failed to reconnect to OBS:', error);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <TooltipProvider>
                {/* OBS Status */}
                <Tooltip content={
                    <div className="space-y-1">
                        <p className="font-semibold">OBS WebSocket</p>
                        <p className="text-sm capitalize">{obsStatus}</p>
                        {obsError && (
                            <p className="text-xs text-red-400 max-w-[200px] break-words">{obsError}</p>
                        )}
                    </div>
                }>
                    <div className={cn(
                        "flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium transition-colors cursor-help",
                        getStatusColor(obsStatus)
                    )}>
                        {getStatusIcon(obsStatus)}
                        <span>OBS</span>
                        {obsStatus === 'error' && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleObsReconnect();
                                }}
                                className="ml-1 p-0.5 hover:bg-white/10 rounded transition-colors"
                                aria-label="Reconnect to OBS"
                            >
                                <RefreshCw className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                </Tooltip>

                {/* Backend API Status */}
                <Tooltip content={
                    <div className="space-y-1">
                        <p className="font-semibold">Backend API</p>
                        <p className="text-sm capitalize">{backendStatus}</p>
                        {backendError && (
                            <p className="text-xs text-red-400 max-w-[200px] break-words">{backendError}</p>
                        )}
                        {backendLastChecked > 0 && (
                            <p className="text-xs text-muted-foreground">
                                Last: {new Date(backendLastChecked).toLocaleTimeString()}
                            </p>
                        )}
                    </div>
                }>
                    <div className={cn(
                        "flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium transition-colors cursor-help",
                        getStatusColor(backendStatus)
                    )}>
                        {getStatusIcon(backendStatus)}
                        <span>API</span>
                    </div>
                </Tooltip>

                {/* Streamer.bot Status */}
                <Tooltip content={
                    <div className="space-y-1">
                        <p className="font-semibold">Streamer.bot</p>
                        <p className="text-sm">{isStreamerBotConnected ? 'Connected' : 'Disconnected'}</p>
                        {streamerBotError && (
                            <p className="text-xs text-red-400 max-w-[200px] break-words">{streamerBotError}</p>
                        )}
                    </div>
                }>
                    <div className={cn(
                        "flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium transition-colors cursor-help",
                        isStreamerBotConnected 
                            ? 'text-green-500 bg-green-500/10 border-green-500/20'
                            : 'text-red-500 bg-red-500/10 border-red-500/20'
                    )}>
                        {isStreamerBotConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                        <span>SB</span>
                    </div>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
};
