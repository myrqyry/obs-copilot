import React from 'react';
import { ChatMessage, CatppuccinAccentColorName, AppTab } from '../types';
interface GeminiChatProps {
    geminiApiKeyFromInput?: string;
    streamerBotService: any;
    onRefreshData: () => Promise<void>;
    setErrorMessage: (message: string | null) => void;
    chatInputValue: string;
    onChatInputChange: (value: string) => void;
    accentColorName?: CatppuccinAccentColorName;
    messages: ChatMessage[];
    onAddMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
    isGeminiClientInitialized: boolean;
    geminiInitializationError: string | null;
    onSetIsGeminiClientInitialized: (status: boolean) => void;
    onSetGeminiInitializationError: (error: string | null) => void;
    activeTab: AppTab;
    onStreamerBotAction: (action: {
        type: string;
        args?: Record<string, any>;
    }) => Promise<void>;
}
export declare const GeminiChat: React.FC<GeminiChatProps>;
export {};
