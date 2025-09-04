import React from 'react';
import { CustomButton as Button } from '@/components/ui/CustomButton';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import useSettingsStore from '@/store/settingsStore';
import useConnectionsStore from '@/store/connectionsStore';

const ObsSettingsPanel: React.FC = () => {
    const { obsUrl, obsPassword, setObsUrl, setObsPassword } = useSettingsStore();
    const { isConnected, connectToObs, disconnectFromObs } = useConnectionsStore();

    const handleConnect = () => {
        connectToObs(obsUrl, obsPassword);
    };

    const handleDisconnect = () => {
        disconnectFromObs();
    };

    return (
        <Card className="shadow-lg p-6">
            <CardHeader>
                <CardTitle>OBS Connection Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="obs-url">OBS WebSocket URL</Label>
                    <Input 
                        id="obs-url"
                        placeholder="e.g., ws://localhost:4455"
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
                        value={obsPassword || ''}
                        onChange={(e) => setObsPassword(e.target.value)}
                    />
                </div>
            </CardContent>
            <div className="flex justify-between mt-4">
                <Button 
                    onClick={handleConnect} 
                    disabled={isConnected}
                >
                    Connect
                </Button>
                <Button 
                    onClick={handleDisconnect} 
                    disabled={!isConnected}
                    variant="destructive"
                >
                    Disconnect
                </Button>
            </div>
        </Card>
    );
};

export default ObsSettingsPanel;
