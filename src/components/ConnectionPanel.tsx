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
    onStreamerBotConnect?: () => void;
    onStreamerBotDisconnect?: () => void;
    isStreamerBotConnected?: boolean;
    isStreamerBotConnecting?: boolean;
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
    onStreamerBotConnect,
    onStreamerBotDisconnect,
    isStreamerBotConnected = false,
    isStreamerBotConnecting = false,
    isGeminiClientInitialized,
    geminiInitializationError,
    accentColorName,
}) => {
    const [showTips, setShowTips] = useState(false);

    return (
        <div className="space-y-1 max-w-4xl mx-auto">
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
                onStreamerBotConnect={onStreamerBotConnect}
                onStreamerBotDisconnect={onStreamerBotDisconnect}
                isStreamerBotConnected={isStreamerBotConnected}
                isStreamerBotConnecting={isStreamerBotConnecting}
                accentColorName={accentColorName}
            />

            {/* Collapsible Setup Tips */}
            <Card>
                <button
                    onClick={() => setShowTips(!showTips)}
                    aria-expanded={showTips}
                    aria-controls="setup-tips-content"
                    className="w-full p-1 flex items-center justify-between text-left hover:bg-muted transition-colors rounded-t-lg group focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 focus:ring-offset-background"
                >
                    <div className="flex items-center space-x-1.5">
                        <span className="emoji text-xs">💡</span>
                        <span className="text-xs font-semibold text-foreground">Quick Setup Guide</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                        <span className="text-xs text-muted-foreground">
                            {showTips ? 'Hide' : 'Show'} tips
                        </span>
                        <svg
                            className={cn(
                                "w-3 h-3 text-muted-foreground transition-transform duration-200",
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
                    <CardContent id="setup-tips-content" className="px-1 pb-1 md:px-2 md:pb-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 md:gap-2 text-xs text-muted-foreground">
                            <div className="bg-card p-1 md:p-2 rounded border border-border">
                                <h4 className="font-medium text-foreground mb-0.5 md:mb-1 text-xs">OBS WebSocket Setup:</h4>
                                <ul className="space-y-0.5 md:space-y-1 text-xs">
                                    <li>• Open OBS Studio</li>
                                    <li>• Go to Tools → WebSocket Server Settings</li>
                                    <li>• Enable WebSocket server</li>
                                    <li>• Set port (default: 4455)</li>
                                    <li>• Optionally set a password</li>
                                </ul>
                            </div>
                            <div className="bg-card p-1 rounded border border-border">
                                <h4 className="font-medium text-foreground mb-0.5 text-xs">Gemini AI Setup:</h4>
                                <ul className="space-y-0.5 text-xs">
                                    <li>• Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline focus:outline-none focus:ring-1 focus:ring-primary rounded">Google AI Studio</a></li>
                                    <li>• Create/sign in to Google account</li>
                                    <li>• Generate new API key</li>
                                    <li>• Copy and paste into field above</li>
                                </ul>
                            </div>
                            <div className="bg-card p-1 rounded border border-border">
                                <h4 className="font-medium text-foreground mb-0.5 text-xs">Streamer.bot Setup:</h4>
                                <ul className="space-y-0.5 text-xs">
                                    <li>• Download from <a href="https://streamer.bot" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline focus:outline-none focus:ring-1 focus:ring-primary rounded">streamer.bot</a></li>
                                    <li>• Enable WebSocket server in Settings</li>
                                    <li>• Set host/port (default: localhost:8080)</li>
                                    <li>• Import actions for enhanced automation</li>
                                    <li>• Connect to enable advanced triggers</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                )}
            </Card>
        </div>
    );
};