import React from 'react';
import { useConnectionsStore } from '@/store/connections';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming this exists, if not I'll use standard class string interpolation or clsx directly

export const ConnectionStatusBar: React.FC = () => {
    const obsStatus = useConnectionsStore((state) => state.obsStatus);
    const isStreamerBotConnected = useConnectionsStore((state) => state.isStreamerBotConnected);

    const getObsColor = () => {
        switch (obsStatus) {
            case 'connected': return 'text-green-500 bg-green-500/10 border-green-500/20';
            case 'connecting':
            case 'reconnecting': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            case 'disconnected':
            case 'error':
            default: return 'text-red-500 bg-red-500/10 border-red-500/20';
        }
    };

    const getStreamerBotColor = () => {
        return isStreamerBotConnected 
            ? 'text-green-500 bg-green-500/10 border-green-500/20' 
            : 'text-red-500 bg-red-500/10 border-red-500/20';
    };

    return (
        <div className="flex items-center gap-2">
            {/* OBS Status */}
            <div className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium transition-colors",
                getObsColor()
            )}>
                {obsStatus === 'connected' && <Wifi className="w-3.5 h-3.5" />}
                {(obsStatus === 'connecting' || obsStatus === 'reconnecting') && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                {(obsStatus === 'disconnected' || obsStatus === 'error') && <WifiOff className="w-3.5 h-3.5" />}
                <span>OBS</span>
            </div>

            {/* Streamer.bot Status */}
            <div className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium transition-colors",
                getStreamerBotColor()
            )}>
                {isStreamerBotConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                <span>SB</span>
            </div>
        </div>
    );
};
