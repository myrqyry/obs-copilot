import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGeminiChat } from '@/hooks/useGeminiChat';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { useChatStore, ChatState } from '@/store/chatStore';
import useSettingsStore from '@/store/settingsStore';
import useConnectionsStore from '@/store/connectionsStore';
import { ChatMessage, CatppuccinAccentColorName } from '@/types';
import { geminiService } from '@/services/geminiService';
import { handleAppError } from '@/lib/errorUtils';
import useUiStore from '@/store/uiStore';
import { Session } from '@google/genai';

interface GeminiChatProps {
    onRefreshData?: () => Promise<void>;
    setErrorMessage: (message: string | null) => void;
    chatInputValue: string;
    onChatInputChange: (value: string) => void;
}

export const GeminiChat: React.FC<GeminiChatProps> = ({
    onRefreshData,
    setErrorMessage,
    chatInputValue,
    onChatInputChange,
}) => {
    // All hooks must be called unconditionally at the top
    const obs = useConnectionsStore((state) => state.obs);
    const isConnected = useConnectionsStore((state) => state.isConnected);
    const sources = useConnectionsStore((state) => state.sources);
    const currentProgramScene = useConnectionsStore((state) => state.currentProgramScene);
    const messages: ChatMessage[] = useChatStore((state: ChatState) => state.geminiMessages);
    const isGeminiClientInitialized = useChatStore((state: ChatState) => state.isGeminiClientInitialized);
    const chatActions = useChatStore((state: ChatState) => state.actions);
    const geminiApiKey = useSettingsStore((state) => state.geminiApiKey);
    const extraDarkMode = useSettingsStore((state) => state.extraDarkMode);
    const flipSides = useSettingsStore((state) => state.flipSides);
    const accentColorName = useSettingsStore((state) => state.theme.accent);
    const userChatBubble = useSettingsStore((state) => state.theme.userChatBubble);
    const modelChatBubble = useSettingsStore((state) => state.theme.modelChatBubble);
    // Add missing type
    const userChatBubbleColorName = userChatBubble as CatppuccinAccentColorName;
    const modelChatBubbleColorName = modelChatBubble as CatppuccinAccentColorName;
    
    // Now call your custom hook unconditionally
    const {
        isLoading,
        useGoogleSearch,
        setUseGoogleSearch,
        handleAddToContext,
        handleSend,
        handleRegenerate,
    } = useGeminiChat(onRefreshData, setErrorMessage, geminiApiKey);

    const onAddMessage = chatActions.addMessage;
    const chatInputRef = useRef<HTMLTextAreaElement>(null);
    const [screenshotWidth] = useState<number>(1920);
    const [screenshotHeight] = useState<number>(1080);
    const [liveSession, setLiveSession] = useState<Session | null>(null);

    const handleAudioInput = async (audioBlob: Blob) => {
        let session = liveSession;
        if (!session) {
            session = await geminiService.liveConnect({
                model: 'gemini-1.5-flash',
                config: {
                    inputAudioTranscription: {
                        model: 'chirp-2.0-us',
                    },
                },
                callbacks: {
                    onmessage: (message: any) => {
                        if ((message as any).transcription) {
                            onChatInputChange(chatInputValue + (message as any).transcription.text);
                        }
                    },
                    onerror: (error: any) => {
                        console.error('Live session error:', error);
                    },
                },
            });
            setLiveSession(session);
        }

        const reader = new FileReader();
        reader.onload = () => {
            const base64Audio = (reader.result as string).split(',')[1];
            // session.sendAudio may be provided at runtime even if types don't declare it
            try { (session as any)?.sendAudio?.(base64Audio); } catch (e) { console.error(e); }
        };
        reader.readAsDataURL(audioBlob);
    };

    // The function that will take an action and send it to OBS
    const handleObsAction = useCallback(async (action: { type: string; args?: Record<string, unknown> }) => {
      if (!isConnected) {
        const errorMsg = handleAppError('GeminiChat OBS action', new Error('Not connected'), 'Not connected to OBS.');
        useUiStore.getState().addError({
          message: errorMsg,
          source: 'GeminiChat',
          level: 'critical',
          details: { actionType: action.type }
        });
        onAddMessage({ role: 'system', text: "❌ Not connected to OBS." });
        return undefined;
      }
    
      if (!obs || typeof obs.call !== 'function') {
        const errorMsg = handleAppError('GeminiChat OBS client', new Error('Client unavailable'), 'OBS client is not available or does not support .call().');
        useUiStore.getState().addError({
          message: errorMsg,
          source: 'GeminiChat',
          level: 'critical',
          details: { actionType: action.type }
        });
        onAddMessage({ role: 'system', text: "❌ OBS client is not initialized." });
        return undefined;
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
                imageHeight: action.args.imageHeight
              });
              return result;
            }
            break;
          default:
            const errorMsg = handleAppError('GeminiChat OBS action', new Error('Unknown type'), `Unknown OBS action type: ${action.type}`);
            useUiStore.getState().addError({
              message: errorMsg,
              source: 'GeminiChat',
              level: 'error',
              details: { actionType: action.type }
            });
            onAddMessage({ role: 'system', text: `🤷‍♂️ Unknown OBS action: ${action.type}` });
        }
      } catch (error) {
        const errorMsg = handleAppError(`GeminiChat OBS action ${action.type}`, error, `Error executing OBS action ${action.type}`);
        useUiStore.getState().addError({
          message: errorMsg,
          source: 'GeminiChat',
          level: 'critical',
          details: { actionType: action.type, args: action.args, error }
        });
        onAddMessage({ role: 'system', text: `❌ Error executing OBS action: ${error instanceof Error ? error.message : 'Unknown error'}` });
        throw error;
      }
      return undefined;
    }, [obs, isConnected, onAddMessage]);

    // Memoize the regenerate callback to prevent infinite re-renders
    const memoizedHandleRegenerate = useCallback((messageId: string) => {
      handleRegenerate(messageId, onChatInputChange, handleSend);
    }, [handleRegenerate, onChatInputChange, handleSend]);
    
    const handleScreenshot = async () => {
      if (!isConnected || !currentProgramScene) {
        const errorMsg = handleAppError('GeminiChat screenshot', new Error('Not ready'), "📸 Need to be connected to OBS with an active scene to take screenshots!");
        useUiStore.getState().addError({
          message: errorMsg,
          source: 'GeminiChat',
          level: 'error',
          details: { isConnected, currentProgramScene }
        });
        onAddMessage({ role: 'system', text: errorMsg });
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
        if (screenshotResult && (screenshotResult as any).imageData) {
          onAddMessage({ role: 'system', text: `📸 Screenshot of current scene "${currentProgramScene}" captured.` });
          handleAddToContext(`Screenshot of current scene "${currentProgramScene}" has been captured and is available for analysis. Image data: ${(screenshotResult as any).imageData.substring(0, 100)}...`);
        } else {
          const errorMsg = handleAppError('GeminiChat screenshot result', new Error('No data'), `📸 Screenshot failed: ${screenshotResult ? JSON.stringify(screenshotResult) : 'Unknown error'}`);
          useUiStore.getState().addError({
            message: errorMsg,
            source: 'GeminiChat',
            level: 'error',
            details: { currentProgramScene, screenshotResult }
          });
          onAddMessage({ role: 'system', text: errorMsg });
        }
      } catch (error: unknown) {
        const errorMsg = handleAppError('GeminiChat screenshot', error, `📸 Screenshot error`);
        useUiStore.getState().addError({
          message: errorMsg,
          source: 'GeminiChat',
          level: 'error',
          details: { currentProgramScene, error }
        });
        onAddMessage({ role: 'system', text: errorMsg });
      }
    };

    // Handle image uploads from the chat input
    const handleImageSelect = async (file: File, base64: string) => {
      try {
        // Create a data URL for preview or storage if needed
        const dataUrl = `data:${file.type};base64,${base64}`;
    
        // Add a system message notifying the user
        onAddMessage({ role: 'system', text: `🖼️ Image uploaded: ${file.name}` });
    
        // Add to context for analysis (truncated sample for logs)
        handleAddToContext(`Uploaded image ${file.name} (${Math.round(file.size / 1024)} KB). Data preview: ${base64.substring(0, 120)}...`);
    
        // Optionally create a media data part to be consumed by streaming handlers
        chatActions.addMessage({
          id: `media-${Date.now()}`,
          role: 'system',
          text: `Image: ${file.name}`,
          timestamp: new Date(),
          dataParts: [
            {
              type: 'media',
              value: {
                url: dataUrl,
                contentType: file.type,
                alt: file.name,
              },
            },
          ],
        });
      } catch (error) {
        const errorMsg = handleAppError('GeminiChat image upload', error, `Failed to process uploaded image ${file.name}`);
        useUiStore.getState().addError({
          message: errorMsg,
          source: 'GeminiChat',
          level: 'error',
          details: { fileName: file.name, error }
        });
        console.error(errorMsg);
        onAddMessage({ role: 'system', text: errorMsg });
      }
    };

    useEffect(() => {
        if (isGeminiClientInitialized) {
            // AI client state is initialized (hook now manages internal client)
        }
    }, [isGeminiClientInitialized]);


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
                userChatBubbleColorName={userChatBubbleColorName}
                modelChatBubbleColorName={modelChatBubbleColorName}
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
                onAudio={handleAudioInput}
                onImageSelect={handleImageSelect}
                chatInputRef={chatInputRef}
            />
        </div>
    );
};
