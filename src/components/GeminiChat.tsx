import React, { useEffect, useRef } from 'react';
import { useGeminiChat } from '../../hooks/useGeminiChat';
import { MessageList } from './chat/MessageList';
import { ChatInput } from './chat/ChatInput';
import { useConnectionStore } from '../../store/connectionStore';
import { useObsStore } from '../../store/obsStore';
import { useChatStore } from '../../store/chatStore';
import { useSettingsStore } from '../../store/settingsStore';
import { CatppuccinAccentColorName, AppTab, ChatMessage } from '../../types';

interface GeminiChatProps {
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
    onStreamerBotAction: (action: { type: string, args?: Record<string, any> }) => Promise<void>;
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
    const { isConnected } = useConnectionStore();
    const { sources, currentProgramScene, actions: obsActions } = useObsStore();
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
        } catch (error: any) {
            onAddMessage({ role: 'system', text: `📸 Screenshot error: ${error.message}` });
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
