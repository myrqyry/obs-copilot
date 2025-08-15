// src/features/connections/ConnectionForm.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/common/TextInput';
import { CollapsibleCard } from '@/components/common/CollapsibleCard';
import { loadConnectionSettings, saveConnectionSettings } from '@/utils/persistence';
import useConnectionsStore from '@/store/connectionsStore';
import { useSettingsStore } from '@/store/settingsStore';

// The form now only needs the connect handlers as props
interface ConnectionFormProps {
  onObsConnect: (url: string, password?: string) => void;
  onStreamerBotConnect: (address: string, port: string) => void;
}

export const ConnectionForm: React.FC<ConnectionFormProps> = ({
  onObsConnect,
  onStreamerBotConnect,
}) => {
    // --- All state is now managed locally within the form ---
    const [obsUrl, setObsUrl] = useState('');
    const [obsPassword, setObsPassword] = useState('');
    const [sbAddress, setSbAddress] = useState('');
    const [sbPort, setSbPort] = useState('');
    const [showPasswordField, setShowPasswordField] = useState(false);
    
    // Get connection status from the global store to update the UI
    const { isConnected: isObsConnected, isConnecting: isObsConnecting } = useConnectionsStore();
    // You can add streamer.bot connection status to a store later if needed
    // const { isStreamerBotConnected, isStreamerBotConnecting } = useSomeStore();

    // Load saved settings when the component mounts
    useEffect(() => {
        const settings = loadConnectionSettings();
        setObsUrl(settings.obsWebSocketUrl || 'ws://localhost:4455');
        setSbAddress(settings.streamerBotAddress || 'localhost');
        setSbPort(settings.streamerBotPort || '8080');
    }, []);

    const handleObsSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        saveConnectionSettings({ obsWebSocketUrl: obsUrl });
        onObsConnect(obsUrl, showPasswordField ? obsPassword : undefined);
    };

    const handleStreamerBotSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        saveConnectionSettings({ streamerBotAddress: sbAddress, streamerBotPort: sbPort });
        onStreamerBotConnect(sbAddress, sbPort);
    };

    return (
        <div className="space-y-2 max-w-4xl mx-auto p-0">
            <CollapsibleCard title="OBS Studio Connection" emoji="🎬" isOpen={true} onToggle={() => {}}>
                <div className="p-4">
                    <form onSubmit={handleObsSubmit} className="space-y-3">
                        <TextInput label="WebSocket URL" value={obsUrl} onChange={(e) => setObsUrl(e.target.value)} />
                        <div>
                            <label className="flex items-center space-x-2 text-sm">
                                <input type="checkbox" checked={showPasswordField} onChange={(e) => setShowPasswordField(e.target.checked)} />
                                <span>Requires Password</span>
                            </label>
                            {showPasswordField && (
                                <TextInput label="Password" type="password" value={obsPassword} onChange={(e) => setObsPassword(e.target.value)} />
                            )}
                        </div>
                        <Button type="submit" disabled={isObsConnecting}>
                            {isObsConnecting ? 'Connecting...' : isObsConnected ? 'Connected' : 'Connect'}
                        </Button>
                    </form>
                </div>
            </CollapsibleCard>

            <CollapsibleCard title="Streamer.bot" emoji="🤖" isOpen={true} onToggle={() => {}}>
                 <div className="p-4">
                    <form onSubmit={handleStreamerBotSubmit} className="space-y-3">
                        <div className="flex gap-4">
                            <TextInput label="Address" value={sbAddress} onChange={(e) => setSbAddress(e.target.value)} />
                            <TextInput label="Port" value={sbPort} onChange={(e) => setSbPort(e.target.value)} />
                        </div>
                        <Button type="submit">Connect</Button>
                    </form>
                </div>
            </CollapsibleCard>
        </div>
    );
};