import React, { useState } from 'react';
import { Button } from './Button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './Card';
import { Label } from './Label';
import { Input } from './Input';
import useSettingsStore from '@/store/settingsStore';
import useConnectionsStore from '@/store/connectionsStore';

const ConnectionForm: React.FC = () => {
    // We now read and write to the global state store
    const { obsUrl, obsPassword, setObsUrl, setObsPassword } = useSettingsStore();
    const { isConnected, isLoading, connectToObs, disconnectFromObs, connectionError } = useConnectionsStore();

    const handleConnect = (e: React.FormEvent) => {
        e.preventDefault();
        connectToObs(obsUrl, obsPassword);
    };

    const handleDisconnect = () => {
        disconnectFromObs();
    };

    return (
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
                <form onSubmit={handleConnect} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="obs-url">OBS WebSocket URL</Label>
                        <Input 
                            id="obs-url"
                            placeholder="ws://localhost:4455"
                            value={obsUrl}
                            onChange={(e) => setObsUrl(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="obs-password">OBS WebSocket Password</Label>
                        <Input 
                            id="obs-password"
                            type="password"
                            placeholder="Enter your password"
                            value={obsPassword}
                            onChange={(e) => setObsPassword(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-between">
                        <Button type="submit" disabled={isConnected || isLoading}>
                            {isLoading ? 'Connecting...' : 'Connect'}
                        </Button>
                        <Button onClick={handleDisconnect} disabled={!isConnected} variant="destructive">
                            Disconnect
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default ConnectionForm;