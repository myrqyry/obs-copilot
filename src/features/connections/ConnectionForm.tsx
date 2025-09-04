import React, { useState } from 'react';
import { CustomButton as Button } from '@/components/ui/CustomButton';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import useSettingsStore from '@/store/settingsStore';
import useConnectionsStore from '@/store/connectionsStore';

interface ConnectionFormProps {
    onObsConnect: (url: string, password?: string) => Promise<void>;
    onStreamerBotConnect: (address: string, port: string) => Promise<void>;
}

const ConnectionForm: React.FC<ConnectionFormProps> = ({ onObsConnect, onStreamerBotConnect }) => {
    // OBS connection state
    const { obsUrl, obsPassword, streamerBotHost, streamerBotPort, setObsUrl, setObsPassword, setStreamerBotHost, setStreamerBotPort } = useSettingsStore();
    const { isConnected, isLoading, connectToObs, disconnectFromObs, connectionError } = useConnectionsStore();
    
    // StreamerBot connection state
    const [isStreamerBotConnected, setIsStreamerBotConnected] = useState(false);
    const [isStreamerBotConnecting, setIsStreamerBotConnecting] = useState(false);
    const [streamerBotError, setStreamerBotError] = useState<string | null>(null);

    // OBS connection handlers
    const handleObsConnect = (e: React.FormEvent) => {
        e.preventDefault();
        onObsConnect(obsUrl, obsPassword);
    };

    const handleObsDisconnect = () => {
        disconnectFromObs();
    };

    // StreamerBot connection handlers
    const handleStreamerBotConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsStreamerBotConnecting(true);
        setStreamerBotError(null);
        try {
            await onStreamerBotConnect(streamerBotHost, streamerBotPort);
            setIsStreamerBotConnected(true);
        } catch (error: any) {
            setStreamerBotError(error.message || 'Failed to connect to Streamer.bot');
            setIsStreamerBotConnected(false);
        } finally {
            setIsStreamerBotConnecting(false);
        }
    };

    const handleStreamerBotDisconnect = () => {
        // For now, just update the UI state
        // In a real implementation, this would call the StreamerBot service disconnect method
        setIsStreamerBotConnected(false);
        setStreamerBotError(null);
    };

    return (
        <div className="space-y-6">
            {/* OBS Connection Card */}
            <Card>
                <CardHeader>
                    <CardTitle>OBS Connection</CardTitle>
                    <CardDescription>
                        {isConnected ? (
                            <span className="text-green-500">Connected to OBS!</span>
                        ) : (
                            <span className="text-destructive">Disconnected</span>
                        )}
                        {connectionError && <span className="ml-2 text-destructive">{connectionError}</span>}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <form onSubmit={handleObsConnect} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="obs-url" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                OBS WebSocket URL
                            </label>
                            <input 
                                id="obs-url"
                                placeholder="ws://localhost:4455"
                                value={obsUrl}
                                onChange={(e) => setObsUrl(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="obs-password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                OBS WebSocket Password
                            </label>
                            <input 
                                id="obs-password"
                                type="password"
                                placeholder="Enter your password"
                                value={obsPassword}
                                onChange={(e) => setObsPassword(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>
                        <div className="flex justify-between">
                            <Button type="submit" disabled={isConnected || isLoading}>
                                {isLoading ? 'Connecting...' : 'Connect'}
                            </Button>
                            <Button onClick={handleObsDisconnect} disabled={!isConnected} variant="destructive">
                                Disconnect
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* StreamerBot Connection Card */}
            <Card>
                <CardHeader>
                    <CardTitle>StreamerBot Connection</CardTitle>
                    <CardDescription>
                        {isStreamerBotConnected ? (
                            <span className="text-green-500">Connected to StreamerBot!</span>
                        ) : (
                            <span className="text-destructive">Disconnected</span>
                        )}
                        {streamerBotError && <span className="ml-2 text-destructive">{streamerBotError}</span>}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <form onSubmit={handleStreamerBotConnect} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="streamerbot-host" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Host
                                </label>
                                <input 
                                    id="streamerbot-host"
                                    placeholder="localhost"
                                    value={streamerBotHost}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStreamerBotHost(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="streamerbot-port" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Port
                                </label>
                                <input 
                                    id="streamerbot-port"
                                    placeholder="8080"
                                    value={streamerBotPort}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStreamerBotPort(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>
                        </div>
                        <div className="flex justify-between">
                            <Button type="submit" disabled={isStreamerBotConnected || isStreamerBotConnecting}>
                                {isStreamerBotConnecting ? 'Connecting...' : 'Connect'}
                            </Button>
                            <Button 
                                onClick={handleStreamerBotDisconnect} 
                                disabled={!isStreamerBotConnected} 
                                variant="destructive"
                            >
                                Disconnect
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default ConnectionForm;
