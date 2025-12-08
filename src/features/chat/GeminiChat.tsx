import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGeminiChat } from '@/shared/hooks/useGeminiChat';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { useChatStore, ChatState } from '@/app/store/chatStore';
import useConfigStore from '@/app/store/configStore';
import useConnectionsStore from '@/app/store/connections';
import { ChatMessage, CatppuccinAccentColorName } from '@/shared/types';
import { geminiService } from '@/shared/services/geminiService';
import { handleAppError } from '@/shared/lib/errorUtils';
import useUiStore from '@/app/store/uiStore';
import type { ChatBackgroundType, ChatPattern } from '@/shared/types/chatBackground';
import { Session } from '@google/genai';
import { Card } from '@/shared/components/ui/Card';

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
    const extraDarkMode = useConfigStore((state) => state.extraDarkMode);
    const flipSides = useConfigStore((state) => state.flipSides);
    const accentColorName = useConfigStore((state) => state.theme.accent);
    const userChatBubble = useConfigStore((state) => state.theme.userChatBubble);
    const modelChatBubble = useConfigStore((state) => state.theme.modelChatBubble);
    const customChatBackground = useConfigStore((state) => state.customChatBackground);
    const chatBackgroundType = useConfigStore((state) => state.chatBackgroundType);
    const chatPattern = useConfigStore((state) => state.chatPattern);
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
        } = useGeminiChat(onRefreshData, setErrorMessage);

    const onAddMessage = chatActions.addMessage;
    const chatInputRef = useRef<HTMLTextAreaElement>(null);
    // Make screenshot dimensions configurable constants (moved from state)
    const SCREENSHOT_WIDTH = 1920;
    const SCREENSHOT_HEIGHT = 1080;
    const [liveSession, setLiveSession] = useState<Session | null>(null);
    const liveSessionRef = useRef<Session | null>(null);

    const handleAudioInput = async (audioBlob: Blob) => {
      let session = liveSessionRef.current as Session | null;
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
            liveSessionRef.current = session;
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
    type ObsSetSceneAction = { type: 'SetScene'; args: { sceneName: string } };
    type ObsGetScreenshotAction = { type: 'GetSourceScreenshot'; args: { sourceName: string; imageFormat: string; imageWidth?: number; imageHeight?: number } };
    type ObsActionType = ObsSetSceneAction | ObsGetScreenshotAction;

    const handleObsAction = useCallback(async (action: any) => {
      if (!isConnected) {
        const errorMsg = handleAppError('GeminiChat OBS action', new Error('Not connected'), 'Not connected to OBS.');
        useUiStore.getState().addError({
          message: errorMsg,
          source: 'GeminiChat',
          level: 'critical',
          details: { actionType: action.type }
        });
        onAddMessage({ role: 'system', text: "❌ Not connected to OBS." });
        throw new Error('Not connected to OBS');
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
        throw new Error('OBS client not initialized');
      }
    
      try {
        const normalizedType = String(action.type || '').toLowerCase();
        switch (normalizedType) {
          case 'setscene':
          case 'setcurrentprogramscene':
            if (action.args?.sceneName) {
              const result = await obs.call('SetCurrentProgramScene', { 'sceneName': action.args.sceneName });
              // Add validation:
              if (result.currentProgramSceneName !== action.args.sceneName) {
                throw new Error(`Scene switch failed - expected ${action.args.sceneName}, got ${result.currentProgramSceneName}`);
              }
              return result;
            }
          case 'getsourcescreenshot':
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
            throw new Error(`Unknown OBS action type: ${action.type}`);
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
            imageWidth: SCREENSHOT_WIDTH,
            imageHeight: SCREENSHOT_HEIGHT
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
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    const handleImageSelect = async (file: File, base64: string) => {
      // Validate file size
      if (file.size > MAX_IMAGE_SIZE) {
        const errorMsg = `Image too large: ${Math.round(file.size / 1024 / 1024)}MB (max 10MB)`;
        useUiStore.getState().addError({ message: errorMsg, source: 'GeminiChat', level: 'error', details: { fileName: file.name, fileSize: file.size } });
        onAddMessage({ role: 'system', text: `❌ ${errorMsg}` });
        return;
      }
      // Validate file type
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        const errorMsg = `Unsupported image type: ${file.type}`;
        useUiStore.getState().addError({ message: errorMsg, source: 'GeminiChat', level: 'error', details: { fileName: file.name, fileType: file.type } });
        onAddMessage({ role: 'system', text: `❌ ${errorMsg}` });
        return;
      }
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

    // Add cleanup in useEffect:
    useEffect(() => {
      return () => {
        // Cleanup on unmount only; use ref so we don't close sessions inadvertently
        if (liveSessionRef.current) {
          liveSessionRef.current.close?.();
          liveSessionRef.current = null;
          setLiveSession(null);
        }
      };
    }, []);


    return (
        <div className="flex flex-col h-full">
            <Card className="p-4 flex flex-col h-full">
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
                    chatBackgroundType={chatBackgroundType}
                    chatPattern={chatPattern}
                    customChatBackground={customChatBackground || ''}
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
            </Card>
        </div>
    );
};
