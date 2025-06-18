import React, { useState } from 'react';
import { ConnectionForm } from './ConnectionForm';
import { CatppuccinAccentColorName } from '../types';
import { Card, CardContent } from './ui';
import { cn } from '../lib/utils';

interface ConnectionPanelProps {
    onConnect: (address: string, password?: string) => void;
    onDisconnect: () => void;
    isConnected: boolean;
    isConnecting: boolean;
    defaultUrl: string;
    error: string | null;
    geminiApiKey: string;
    envGeminiApiKey?: string;
    onGeminiApiKeyChange: (key: string) => void;
    isGeminiClientInitialized: boolean;
    geminiInitializationError: string | null;
    streamerBotAddress: string;
    setStreamerBotAddress: (value: string) => void;
    streamerBotPort: string;
    setStreamerBotPort: (value: string) => void;
    accentColorName?: CatppuccinAccentColorName;
}

export const ConnectionPanel: React.FC<ConnectionPanelProps> = ({
    onConnect,
    onDisconnect,
    isConnected,
    isConnecting,
    defaultUrl,
    error,
    geminiApiKey,
    envGeminiApiKey,
    onGeminiApiKeyChange,
    streamerBotAddress,
    setStreamerBotAddress,
    streamerBotPort,
    setStreamerBotPort,
    isGeminiClientInitialized,
    geminiInitializationError,
    accentColorName,
}) => {
    const [showTips, setShowTips] = useState(false);

    return (
        <div className="space-y-3 max-w-4xl mx-auto">
            {/* Connection Form */}
            <ConnectionForm
                onConnect={onConnect}
                onDisconnect={onDisconnect}
                isConnected={isConnected}
                isConnecting={isConnecting}
                defaultUrl={defaultUrl}
                error={error}
                geminiApiKey={geminiApiKey}
                envGeminiApiKey={envGeminiApiKey}
                onGeminiApiKeyChange={onGeminiApiKeyChange}
                isGeminiClientInitialized={isGeminiClientInitialized}
                geminiInitializationError={geminiInitializationError}
                streamerBotAddress={streamerBotAddress}
                setStreamerBotAddress={setStreamerBotAddress}
                streamerBotPort={streamerBotPort}
                setStreamerBotPort={setStreamerBotPort}
                accentColorName={accentColorName}
            />

            {/* Collapsible Setup Tips */}
            <Card className="border-border">
                <button
                    onClick={() => setShowTips(!showTips)}
                    className="w-full p-3 flex items-center justify-between text-left hover:bg-muted transition-colors rounded-lg"
                >
                    <div className="flex items-center space-x-2">
                        <span className="emoji">💡</span>
                        <span className="text-sm font-medium text-primary">Quick Setup Guide</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="text-xs text-muted-foreground">
                            {showTips ? 'Hide' : 'Show'} tips
                        </span>
                        <svg
                            className={cn(
                                "w-4 h-4 text-muted-foreground transition-transform duration-200",
                                showTips ? 'rotate-180' : ''
                            )}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </button>

                {showTips && (
                    <CardContent className="px-3 pb-3">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs text-muted-foreground">
                            <div className="bg-card p-2 rounded border border-border">
                                <h4 className="font-medium text-foreground mb-1">OBS WebSocket Setup:</h4>
                                <ul className="space-y-0.5">
                                    <li>• Open OBS Studio</li>
                                    <li>• Go to Tools → WebSocket Server Settings</li>
                                    <li>• Enable WebSocket server</li>
                                    <li>• Set port (default: 4455)</li>
                                    <li>• Optionally set a password</li>
                                </ul>
                            </div>
                            <div className="bg-card p-2 rounded border border-border">
                                <h4 className="font-medium text-foreground mb-1">Gemini AI Setup:</h4>
                                <ul className="space-y-0.5">
                                    <li>• Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google AI Studio</a></li>
                                    <li>• Create/sign in to Google account</li>
                                    <li>• Generate new API key</li>
                                    <li>• Copy and paste into field above</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                )}
            </Card>
        </div>
    );
};