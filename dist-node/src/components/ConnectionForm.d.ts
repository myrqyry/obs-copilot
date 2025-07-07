import React from 'react';
import { CatppuccinAccentColorName } from '../types';
interface ConnectionFormProps {
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
export declare const ConnectionForm: React.FC<ConnectionFormProps>;
export {};
