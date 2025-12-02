// src/components/settings/ConnectionSettings.tsx
import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { obsClient } from '@/services/obsClient';
import { toast } from 'sonner';

export const ConnectionSettings: React.FC = () => {
    const { settings, updateSettings } = useSettingsStore();

    // Local state for form management
    const [obsUrl, setObsUrl] = useState(settings.obs.url);
    const [obsPort, setObsPort] = useState(settings.obs.port.toString());
    const [obsPassword, setObsPassword] = useState(settings.obs.password || '');
    const [obsAutoConnect, setObsAutoConnect] = useState(settings.obs.autoConnect);
    const [backendUrl, setBackendUrl] = useState(settings.backend.url);

    // Update local state when store changes (e.g. initial load)
    useEffect(() => {
        setObsUrl(settings.obs.url);
        setObsPort(settings.obs.port.toString());
        setObsPassword(settings.obs.password || '');
        setObsAutoConnect(settings.obs.autoConnect);
        setBackendUrl(settings.backend.url);
    }, [settings]);

    const handleSaveObs = () => {
        const port = parseInt(obsPort, 10);
        if (isNaN(port)) {
            toast.error('Invalid OBS Port');
            return;
        }

        updateSettings('obs', {
            url: obsUrl,
            port,
            password: obsPassword,
            autoConnect: obsAutoConnect
        });
        toast.success('OBS settings saved');
    };

    const handleSaveBackend = () => {
        updateSettings('backend', {
            url: backendUrl
        });
        toast.success('Backend settings saved');
    };

    const handleTestObs = async () => {
        try {
            const port = parseInt(obsPort, 10);
            const address = `ws://${obsUrl}:${port}`;
            await obsClient.connect(address, obsPassword);
            toast.success('Connected to OBS successfully!');
        } catch (error) {
            toast.error('Failed to connect to OBS');
            console.error(error);
        }
    };

    return (
        <div className="space-y-6 p-4 max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>OBS Connection</CardTitle>
                    <CardDescription>Configure how the dashboard connects to OBS Studio.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="obs-url">Host (IP)</Label>
                            <Input
                                id="obs-url"
                                value={obsUrl}
                                onChange={(e) => setObsUrl(e.target.value)}
                                placeholder="localhost"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="obs-port">Port</Label>
                            <Input
                                id="obs-port"
                                value={obsPort}
                                onChange={(e) => setObsPort(e.target.value)}
                                placeholder="4455"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="obs-password">Password</Label>
                        <Input
                            id="obs-password"
                            type="password"
                            value={obsPassword}
                            onChange={(e) => setObsPassword(e.target.value)}
                            placeholder="OBS WebSocket Password"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="obs-autoconnect"
                            checked={obsAutoConnect}
                            onCheckedChange={(c) => setObsAutoConnect(c === true)}
                        />
                        <Label htmlFor="obs-autoconnect">Auto-connect on startup</Label>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={handleTestObs}>Test Connection</Button>
                    <Button onClick={handleSaveObs}>Save OBS Settings</Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Backend API</CardTitle>
                    <CardDescription>Configure the connection to the Python backend.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="backend-url">API URL</Label>
                        <Input
                            id="backend-url"
                            value={backendUrl}
                            onChange={(e) => setBackendUrl(e.target.value)}
                            placeholder="http://localhost:8000"
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button onClick={handleSaveBackend}>Save Backend Settings</Button>
                </CardFooter>
            </Card>
        </div>
    );
};
