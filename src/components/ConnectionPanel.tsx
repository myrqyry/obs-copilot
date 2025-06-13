import React, { useState } from 'react';
import { ConnectionForm } from './ConnectionForm';
import { CatppuccinAccentColorName } from '../types';

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
                accentColorName={accentColorName}
            />

            {/* Collapsible Setup Tips */}
            <div className="bg-[var(--ctp-surface0)] rounded-lg border border-[var(--ctp-surface1)]">
                <button
                    onClick={() => setShowTips(!showTips)}
                    className="w-full p-3 flex items-center justify-between text-left hover:bg-[var(--ctp-surface1)] transition-colors rounded-lg"
                >
                    <div className="flex items-center space-x-2">
                        <span className="emoji">💡</span>
                        <span className="text-sm font-medium text-[var(--dynamic-accent)]">Quick Setup Guide</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="text-xs text-[var(--ctp-subtext0)]">
                            {showTips ? 'Hide' : 'Show'} tips
                        </span>
                        <svg
                            className={`w-4 h-4 text-[var(--ctp-subtext0)] transition-transform duration-200 ${showTips ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </button>

                {showTips && (
                    <div className="px-3 pb-3">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs text-[var(--ctp-subtext0)]">
                            <div className="bg-[var(--ctp-mantle)] p-2 rounded border border-[var(--ctp-surface2)]">
                                <h4 className="font-medium text-[var(--ctp-text)] mb-1">OBS WebSocket Setup:</h4>
                                <ul className="space-y-0.5">
                                    <li>• Open OBS Studio</li>
                                    <li>• Go to Tools → WebSocket Server Settings</li>
                                    <li>• Enable WebSocket server</li>
                                    <li>• Set port (default: 4455)</li>
                                    <li>• Optionally set a password</li>
                                </ul>
                            </div>
                            <div className="bg-[var(--ctp-mantle)] p-2 rounded border border-[var(--ctp-surface2)]">
                                <h4 className="font-medium text-[var(--ctp-text)] mb-1">Gemini AI Setup:</h4>
                                <ul className="space-y-0.5">
                                    <li>• Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-[var(--dynamic-accent)] hover:underline">Google AI Studio</a></li>
                                    <li>• Create/sign in to Google account</li>
                                    <li>• Generate new API key</li>
                                    <li>• Copy and paste into field above</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
