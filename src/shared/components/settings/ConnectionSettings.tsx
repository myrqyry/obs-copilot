// src/components/settings/ConnectionSettings.tsx
import React, { useState } from 'react';
import { Label } from '@/shared/components/ui/label';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/Button';
import { Switch } from '@/shared/components/ui/switch';
import { useSettingsStore } from '@/app/store/settingsStore';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { obsClient } from '@/shared/services/obsClient';

export const ConnectionSettings: React.FC = () => {
    const { settings, updateSettings } = useSettingsStore();
    const [isTestingOBS, setIsTestingOBS] = useState(false);
    const [obsTestResult, setObsTestResult] = useState<'success' | 'error' | null>(null);
    const [isTestingBackend, setIsTestingBackend] = useState(false);
    const [backendTestResult, setBackendTestResult] = useState<'success' | 'error' | null>(null);

    const handleTestOBSConnection = async () => {
        setIsTestingOBS(true);
        setObsTestResult(null);

        try {
            // Temporarily connect to test
            const wsUrl = `ws://${settings.obs.url}:${settings.obs.port}`;
            await obsClient.connect(wsUrl, settings.obs.password);
            setObsTestResult('success');

            // Disconnect after successful test
            setTimeout(() => {
                obsClient.disconnect();
            }, 1000);
        } catch (error) {
            console.error('OBS connection test failed:', error);
            setObsTestResult('error');
        } finally {
            setIsTestingOBS(false);
        }
    };

    const handleTestBackendConnection = async () => {
        setIsTestingBackend(true);
        setBackendTestResult(null);

        try {
            const response = await fetch(`${settings.backend.url}/api/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000)
            });

            if (response.ok) {
                setBackendTestResult('success');
            } else {
                setBackendTestResult('error');
            }
        } catch (error) {
            console.error('Backend connection test failed:', error);
            setBackendTestResult('error');
        } finally {
            setIsTestingBackend(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* OBS WebSocket Settings */}
            <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    🎥 OBS WebSocket Connection
                </h3>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="obs-url">Host / IP Address</Label>
                        <Input
                            id="obs-url"
                            type="text"
                            placeholder="localhost or 192.168.1.100"
                            value={settings.obs.url}
                            onChange={(e) => updateSettings('obs', { url: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">
                            Use 'localhost' if OBS is on this device
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="obs-port">Port</Label>
                        <Input
                            id="obs-port"
                            type="number"
                            placeholder="4455"
                            value={settings.obs.port}
                            onChange={(e) => updateSettings('obs', { port: parseInt(e.target.value) || 4455 })}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="obs-password">Password (optional)</Label>
                    <Input
                        id="obs-password"
                        type="password"
                        placeholder="Enter WebSocket password if required"
                        value={settings.obs.password || ''}
                        onChange={(e) => updateSettings('obs', { password: e.target.value })}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Switch
                            id="obs-auto-connect"
                            checked={settings.obs.autoConnect}
                            onCheckedChange={(checked) => updateSettings('obs', { autoConnect: checked })}
                        />
                        <Label htmlFor="obs-auto-connect" className="text-sm cursor-pointer">
                            Auto-connect on startup
                        </Label>
                    </div>

                    <Button
                        onClick={handleTestOBSConnection}
                        disabled={isTestingOBS}
                        variant="outline"
                        size="sm"
                    >
                        {isTestingOBS ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Testing...
                            </>
                        ) : obsTestResult === 'success' ? (
                            <>
                                <CheckCircle2 className="w-4 h-4 mr-2 text-success" />
                                Connected!
                            </>
                        ) : obsTestResult === 'error' ? (
                            <>
                                <AlertCircle className="w-4 h-4 mr-2 text-destructive" />
                                Failed
                            </>
                        ) : (
                            'Test Connection'
                        )}
                    </Button>
                </div>

                {obsTestResult === 'error' && (
                    <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                        ⚠️ Could not connect to OBS. Check that:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>OBS is running</li>
                            <li>WebSocket server is enabled (Tools → WebSocket Server Settings)</li>
                            <li>The host/port/password are correct</li>
                        </ul>
                    </div>
                )}
            </div>

            {/* Backend API Settings */}
            <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    🔌 Backend API Connection
                </h3>

                <div className="space-y-2">
                    <Label htmlFor="backend-url">API Base URL</Label>
                    <Input
                        id="backend-url"
                        type="url"
                        placeholder="http://localhost:8000"
                        value={settings.backend.url}
                        onChange={(e) => updateSettings('backend', { url: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                        The base URL for the OBS Copilot backend server
                    </p>
                </div>

                <div className="flex justify-end">
                    <Button
                        onClick={handleTestBackendConnection}
                        disabled={isTestingBackend}
                        variant="outline"
                        size="sm"
                    >
                        {isTestingBackend ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Testing...
                            </>
                        ) : backendTestResult === 'success' ? (
                            <>
                                <CheckCircle2 className="w-4 h-4 mr-2 text-success" />
                                Connected!
                            </>
                        ) : backendTestResult === 'error' ? (
                            <>
                                <AlertCircle className="w-4 h-4 mr-2 text-destructive" />
                                Failed
                            </>
                        ) : (
                            'Test Connection'
                        )}
                    </Button>
                </div>

                {backendTestResult === 'error' && (
                    <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                        ⚠️ Could not reach backend API. Ensure the server is running.
                    </div>
                )}
            </div>
        </div>
    );
};
