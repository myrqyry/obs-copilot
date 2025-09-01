// src/components/ui/ConnectionPanel.tsx
import React from 'react';
import { CustomButton as Button } from './CustomButton'; // Assuming Button is CustomButton
import { Card } from './Card';
import { CardHeader } from './Card';
import { CardTitle } from './Card';
import { CardContent } from './Card';
import useConnectionsStore from '../../store/connectionsStore';
import { useSettingsStore } from '../../store/settingsStore';

const ConnectionPanel: React.FC = () => {
    // Read connection status from the connections store
    const { isConnected, connectToObs, disconnectFromObs, connectionError } = useConnectionsStore();
    // Read connection settings from the settings store
    const { obsUrl, obsPassword } = useSettingsStore();

    const handleConnect = () => {
        connectToObs(obsUrl, obsPassword);
    };

    const handleDisconnect = () => {
        disconnectFromObs();
    };

    return (
        <Card className="shadow-lg p-6">
            <CardHeader>
                <CardTitle>OBS Connection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm">
                    {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
                    {connectionError && <span className="text-destructive font-semibold ml-2">{connectionError}</span>}
                </p>
                <div className="flex space-x-2">
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
            </CardContent>
        </Card>
    );
};

export default ConnectionPanel;
