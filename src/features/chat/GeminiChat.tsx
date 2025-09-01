import React, { useEffect, useRef, useState, useCallback } from 'react'; // Import useCallback
import { useGeminiChat } from '@/hooks/useGeminiChat';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { useConnectionManagerStore } from '@/store/connectionManagerStore';
import { useChatStore, ChatState } from '@/store/chatStore';
import { useSettingsStore, SettingsState } from '../../store/settingsStore'; // Corrected import path and named import
import { ChatMessage } from '@/types'; // Removed unused OBSSource import
import useConnectionsStore from '@/store/connectionsStore'; // Import the store directly

interface GeminiChatProps {
    onRefreshData: () => Promise<void>;
    setErrorMessage: (message: string | null) => void;
    chatInputValue: string;
    onChatInputChange: (value: string) => void;
    // Removed onStreamerBotAction as it will be handled internally
}

export const GeminiChat: React.FC<GeminiChatProps> = ({
    onRefreshData,
    setErrorMessage,
    chatInputValue,
    onChatInputChange,
}) => {
    const obs = useConnectionsStore((state) => state.obs);
    const isConnected = useConnectionsStore((state) => state.isConnected);
    const sources = useConnectionsStore((state) => state.sources);
    const currentProgramScene = useConnectionsStore((state) => state.currentProgramScene);

    // The function that will take an action and send it to OBS
    const handleObsAction = useCallback(async (action: { type: string; args?: Record<string, unknown> }) => {
        if (!isConnected) {
            console.error('Not connected to OBS.');
            return;
        }

        if (!obs || typeof obs.call !== 'function') {
            console.error('OBS client is not available or does not support .call().');
            return;
        }

        try {
            switch (action.type) {
                case 'SetScene':
                    if (action.args?.sceneName) {
                        const result = await obs.call('SetCurrentProgramScene', { 'sceneName': action.args.sceneName });
                        console.log(`Successfully switched to scene: ${action.args.sceneName}`);
                        return result;
                    }
                    break;
                case 'GetSourceScreenshot':
                    if (action.args?.sourceName && action.args?.imageFormat) {
                        const result = await obs.call('GetSourceScreenshot', {
                            sourceName: action.args.sourceName,
                            imageFormat: action.args.imageFormat,
                            imageWidth: action.args.imageWidth,
                            imageHeight: action.args.imageHeight,
                        });
                        return result;
                    }
                    break;
                // Add more cases for other actions like 'SetSourceVisibility', etc.
                default:
                    console.warn(`Unknown OBS action type: ${action.type}`);
            }
        } catch (error) {
            console.error(`Error executing OBS action ${action.type}:`, error);
            throw error;
        }
        return undefined;
    }, [obs, isConnected]); // Dependencies for useCallback

    const messages: ChatMessage[] = useChatStore((state: ChatState) => state.geminiMessages);
    const isGeminiClientInitialized = useChatStore(
        (state: ChatState) => state.isGeminiClientInitialized
    );
    const chatActions = useChatStore((state: ChatState) => state.actions);

    const extraDarkMode = useSettingsStore((state: SettingsState) => state.extraDarkMode);
    const flipSides = useSettingsStore((state: SettingsState) => state.flipSides);
    // Select theme properties individually to avoid returning a new object each render
    const accentColorName = useSettingsStore((state: SettingsState) => state.theme.accent);
    const userChatBubble = useSettingsStore((state: SettingsState) => state.theme.userChatBubble);
    const modelChatBubble = useSettingsStore((state: SettingsState) => state.theme.modelChatBubble);
    const geminiApiKey = useSettingsStore((state: SettingsState) => state.geminiApiKey); // Get geminiApiKey

    const onAddMessage = chatActions.addMessage;

    const {
        isLoading,
        useGoogleSearch,
        setUseGoogleSearch,
        handleAddToContext,
        handleSend,
        // handleObsAction is now defined locally in GeminiChat
        handleRegenerate, // Destructure handleRegenerate
    } = useGeminiChat(onRefreshData, setErrorMessage, geminiApiKey); // Removed handleObsAction from arguments

    // Memoize the regenerate callback to prevent infinite re-renders
    const memoizedHandleRegenerate = useCallback((messageId: string) => {
        handleRegenerate(messageId, onChatInputChange, handleSend);
    }, [handleRegenerate, onChatInputChange, handleSend]);

    const chatInputRef = useRef<HTMLTextAreaElement>(null); // Changed to HTMLTextAreaElement

    useEffect(() => {
        if (isGeminiClientInitialized) {
            // AI client state is initialized (hook now manages internal client)
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
            const screenshotResult = await handleObsAction({
                type: 'GetSourceScreenshot',
                args: {
                    sourceName: currentProgramScene,
                    imageFormat: 'png',
                    imageWidth: screenshotWidth,
                    imageHeight: screenshotHeight
                }
            });
            if (screenshotResult && screenshotResult.imageData) {
                onAddMessage({ role: 'system', text: `📸 Screenshot of current scene \"${currentProgramScene}\" captured.` });
                handleAddToContext(`Screenshot of current scene \"${currentProgramScene}\" has been captured and is available for analysis. Image data: ${screenshotResult.imageData.substring(0, 100)}...`);
            } else {
                onAddMessage({ role: 'system', text: `📸 Screenshot failed: ${screenshotResult ? JSON.stringify(screenshotResult) : 'Unknown error'}` });
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
                handleRegenerate={memoizedHandleRegenerate}
                userChatBubbleColorName={userChatBubble}
                modelChatBubbleColorName={modelChatBubble}
                customChatBackground=""
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
                chatInputRef={chatInputRef}
            />
        </div>
    );
};
