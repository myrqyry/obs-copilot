import React, { useEffect, useRef } from 'react';
import { useGeminiChat } from '../hooks/useGeminiChat';
import { MessageList } from './chat/MessageList';
import { ChatInput } from './chat/ChatInput';
import { useConnectionManagerStore } from '../store/connectionManagerStore';
import { useChatStore } from '../store/chatStore';
import { useSettingsStore } from '../store/settingsStore';
import { CatppuccinAccentColorName, AppTab, ChatMessage } from '../types';
import { StreamerBotService } from '../services/streamerBotService';

interface GeminiChatProps {
    streamerBotService: StreamerBotService | null;
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
    args?: Record<string, unknown>;
  }) => Promise<void>;
}

export const GeminiChat: React.FC<GeminiChatProps> = ({
    streamerBotService,
    onRefreshData,
    setErrorMessage,
    chatInputValue,
    onChatInputChange,
    accentColorName,
    messages,
    onAddMessage,
    isGeminiClientInitialized,
    onSetIsGeminiClientInitialized,
    onSetGeminiInitializationError,
    onStreamerBotAction,
}) => {
    const { isConnected, sources, currentProgramScene, actions: obsActions } = useConnectionManagerStore();
    const { actions: chatActions } = useChatStore();
    const { extraDarkMode, flipSides, theme } = useSettingsStore();

    const {
        isLoading,
        useGoogleSearch,
        setUseGoogleSearch,
        handleAddToContext,
        handleSend,
        ai,
    } = useGeminiChat(onRefreshData, setErrorMessage, onStreamerBotAction);

    const chatInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isGeminiClientInitialized && ai.current) {
            // AI is already initialized by the hook
        }
    }, [isGeminiClientInitialized, ai]);

    const handleScreenshot = async () => {
        if (!isConnected || !currentProgramScene) {
            onAddMessage({ role: 'system', text: "📸 Need to be connected to OBS with an active scene to take screenshots!" });
            return;
        }
        try {
            const screenshot = await obsActions.handleObsAction({
                type: 'getSourceScreenshot',
                sourceName: currentProgramScene,
                imageFormat: 'png'
            });
            if (screenshot.success) {
                onAddMessage({ role: 'system', text: screenshot.message });
                handleAddToContext(`Screenshot of current scene \"${currentProgramScene}\" has been captured and is available for analysis.`);
            } else {
                onAddMessage({ role: 'system', text: `📸 Screenshot failed: ${screenshot.error}` });
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                onAddMessage({ role: 'system', text: `📸 Screenshot error: ${error.message}` });
            } else {
                onAddMessage({ role: 'system', text: `📸 Screenshot error: Unknown error` });
            }
        }
    };

    return (
        <div className="flex flex-col h-full bg-background border-l border-r border-b border-border rounded-b-lg shadow-lg relative">
            <MessageList
                messages={messages}
                isLoading={isLoading}
                handleSuggestionClick={(prompt) => onChatInputChange(prompt)}
                accentColorName={accentColorName}
                obsSources={sources}
                handleAddToContext={handleAddToContext}
                extraDarkMode={extraDarkMode}
                flipSides={flipSides}
                handleRegenerate={() => { }}
                userChatBubbleColorName={theme.userChatBubble}
                modelChatBubbleColorName={theme.modelChatBubble}
                customChatBackground={""}
            />
            <ChatInput
                chatInputValue={chatInputValue}
                onChatInputChange={onChatInputChange}
                isLoading={isLoading}
                isGeminiClientInitialized={isGeminiClientInitialized}
                handleSend={() => handleSend(chatInputValue, onChatInputChange)}
                useGoogleSearch={useGoogleSearch}
                setUseGoogleSearch={setUseGoogleSearch}
                isConnected={isConnected}
                currentProgramScene={currentProgramScene}
                onScreenshot={handleScreenshot}
                accentColorName={accentColorName}
                chatInputRef={chatInputRef}
            />
        </div>
    );
};
