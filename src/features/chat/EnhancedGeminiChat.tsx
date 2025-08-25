import React, { useEffect, useRef, useState } from 'react';
import { useGeminiChat } from '@/hooks/useGeminiChat';
import { EnhancedMessageList } from './EnhancedMessageList';
import { EnhancedChatInput } from './EnhancedChatInput';
import { useConnectionManagerStore } from '@/store/connectionManagerStore';
import { useChatStore } from '@/store/chatStore';
import { useSettingsStore } from '@/store/settingsStore';

interface EnhancedGeminiChatProps {
    onRefreshData: () => Promise<void>;
    setErrorMessage: (message: string | null) => void;
    chatInputValue: string;
    onChatInputChange: (value: string) => void;
    onStreamerBotAction: (action: {
    type: string;
    args?: Record<string, unknown>;
  }) => Promise<void>;
}

export const EnhancedGeminiChat: React.FC<EnhancedGeminiChatProps> = ({
    onRefreshData,
    setErrorMessage,
    chatInputValue,
    onChatInputChange,
    onStreamerBotAction,
}) => {
    const isConnected = useConnectionManagerStore((state: any) => state.isConnected);
    const sources = useConnectionManagerStore((state: any) => state.sources);
    const currentProgramScene = useConnectionManagerStore((state: any) => state.currentProgramScene);
    const messages = useChatStore((state: any) => state.geminiMessages);
    const isGeminiClientInitialized = useChatStore((state: any) => state.isGeminiClientInitialized);
    const chatActions = useChatStore((state: any) => state.actions);

    const extraDarkMode = useSettingsStore((state: any) => state.extraDarkMode);
    const flipSides = useSettingsStore((state: any) => state.flipSides);
    const theme = useSettingsStore((state: any) => state.theme);

    const onAddMessage = chatActions.addMessage;
    const accentColorName = theme.accent;

    const {
        isLoading,
        useGoogleSearch,
        setUseGoogleSearch,
        handleAddToContext,
        handleSend,
        handleObsAction,
    } = useGeminiChat(onRefreshData, setErrorMessage, onStreamerBotAction);

    const chatInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isGeminiClientInitialized) {
            // AI is already initialized by the hook
        }
    }, [isGeminiClientInitialized]);

    const [screenshotWidth] = useState<number>(1920);
    const [screenshotHeight] = useState<number>(1080);

    const handleScreenshot = async () => {
        if (!isConnected || !currentProgramScene) {
            onAddMessage({ role: 'system', text: "📸 Need to be connected to OBS with an active scene to take screenshots!" });
            return;
        }
        try {
            const screenshot = await handleObsAction({
                type: 'getSourceScreenshot',
                sourceName: currentProgramScene,
                imageFormat: 'png',
                imageWidth: screenshotWidth,
                imageHeight: screenshotHeight
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
            <EnhancedMessageList
                messages={messages}
                isLoading={isLoading}
                handleSuggestionClick={(prompt: string) => onChatInputChange(prompt)}
                accentColorName={accentColorName}
                obsSources={sources}
                handleAddToContext={handleAddToContext}
                extraDarkMode={extraDarkMode}
                flipSides={flipSides}
                handleRegenerate={(messageId: string) => {
                    // TODO: Implement message regeneration logic
                    console.log('Regenerate message:', messageId);
                }}
                userChatBubbleColorName={theme.userChatBubble}
                modelChatBubbleColorName={theme.modelChatBubble}
                customChatBackground={""}
            />
            <EnhancedChatInput
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
                chatInputRef={chatInputRef}
            />
        </div>
    );
};

export default EnhancedGeminiChat;
