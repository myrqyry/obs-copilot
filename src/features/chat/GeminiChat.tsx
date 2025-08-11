import React, { useEffect, useRef } from 'react';
import { useGeminiChat } from '@/hooks/useGeminiChat';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { useConnectionManagerStore } from '@/store/connectionManagerStore';
import { ConnectionState } from '@/store/connectionsStore';
import { useChatStore, ChatState } from '@/store/chatStore';
import { useSettingsStore, SettingsState } from '@/store/settingsStore';
import { StreamerBotService } from '@/services/streamerBotService';
import { useObsActions } from '@/hooks/useObsActions';

interface GeminiChatProps {
    onRefreshData: () => Promise<void>;
    setErrorMessage: (message: string | null) => void;
    chatInputValue: string;
    onChatInputChange: (value: string) => void;
    onStreamerBotAction: (action: {
    type: string;
    args?: Record<string, unknown>;
  }) => Promise<void>;
}

export const GeminiChat: React.FC<GeminiChatProps> = ({
    onRefreshData,
    setErrorMessage,
    chatInputValue,
    onChatInputChange,
    onStreamerBotAction,
}) => {
    const isConnected = useConnectionManagerStore((state: ConnectionState) => state.isConnected);
    const sources = useConnectionManagerStore((state: ConnectionState) => state.sources);
    const currentProgramScene = useConnectionManagerStore((state: ConnectionState) => state.currentProgramScene);
    const { handleObsAction } = useObsActions();

    const messages = useChatStore((state: ChatState) => state.geminiMessages);
    const isGeminiClientInitialized = useChatStore((state: ChatState) => state.isGeminiClientInitialized);
    const chatActions = useChatStore((state: ChatState) => state.actions);

    const extraDarkMode = useSettingsStore((state: SettingsState) => state.extraDarkMode);
    const flipSides = useSettingsStore((state: SettingsState) => state.flipSides);
    const theme = useSettingsStore((state: SettingsState) => state.theme);

    const onAddMessage = chatActions.addMessage;
    const accentColorName = theme.accent;

    const {
        isLoading,
        useGoogleSearch,
        setUseGoogleSearch,
        handleAddToContext,
        handleSend,
        ai,
    } = useGeminiChat(onRefreshData, setErrorMessage, onStreamerBotAction);

    const chatInputRef: React.RefObject<HTMLInputElement> = useRef(null);

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
            const screenshot = await handleObsAction({
                type: 'getSourceScreenshot',
                sourceName: currentProgramScene,
                imageFormat: 'png'
            });
            if (screenshot && screenshot.success) {
                onAddMessage({ role: 'system', text: screenshot.message });
                handleAddToContext(`Screenshot of current scene \"${currentProgramScene}\" has been captured and is available for analysis.`);
            } else {
                onAddMessage({ role: 'system', text: `📸 Screenshot failed: ${screenshot ? screenshot.error : 'Unknown error'}` });
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
