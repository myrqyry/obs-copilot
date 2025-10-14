import { useState, useCallback, useEffect, useMemo } from 'react';
import { aiService } from '@/services/aiService';
import { obsClient } from '@/services/obsClient';
import useConnectionsStore from '@/store/connectionsStore';
import { useChatStore } from '@/store/chatStore';
import { INITIAL_SYSTEM_PROMPT } from '@/constants';
import { buildMarkdownStylingSystemMessage } from '@/utils/systemPrompts';
import { logger } from '@/utils/logger';
import { handleAppError } from '@/lib/errorUtils';
import { useErrorStore } from '@/store/errorStore'; // Import useErrorStore
import type { GeminiActionResponse, ObsAction, StreamingHandlers, SupportedDataPart } from '@/types/obsActions';
import { OBSScene, OBSSource } from '@/types';

import { useObsActions } from './useObsActions';
import { aiSdk5Config } from '@/config';

export const useGeminiChat = (
  onRefreshData: (() => Promise<void>) | undefined,
  setErrorMessage: (message: string | null) => void,
) => {
  const isConnected = useConnectionsStore((state) => state.isConnected);
  const obs = useConnectionsStore((state) => state.obs);
  const scenes = useConnectionsStore((state) => state.scenes);
  const currentProgramScene = useConnectionsStore((state) => state.currentProgramScene);
  const sources = useConnectionsStore((state) => state.sources);
  const streamStatus = useConnectionsStore((state) => state.streamStatus);
  const recordStatus = useConnectionsStore((state) => state.recordStatus);
  const videoSettings = useConnectionsStore((state) => state.videoSettings);

  const userDefinedContext = useChatStore((state) => state.userDefinedContext);
  const chatActions = useChatStore((state) => state.actions);
   

  // Effect to initialize Gemini client status (guarded, mount-only)
  useEffect(() => {
    // API key handled by backend - assume client is always initialized
    const current = useChatStore.getState().isGeminiClientInitialized;
    if (!current) {
      useChatStore.getState().actions.setGeminiClientInitialized(true);
    }

    // Intentionally do not auto-deinitialize on unmount here to avoid accidental toggling.
    // If explicit deinitialization is required, handle it via a dedicated user action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const obsData = useMemo(
    () => ({
      scenes,
      currentProgramScene,
      sources,
      streamStatus,
      recordStatus,
      videoSettings,
    }),
    [scenes, currentProgramScene, sources, streamStatus, recordStatus, videoSettings]
  );

  // AI SDK 5 Data Parts streaming support
  const emitDataPart = useCallback((dataPart: SupportedDataPart, messageId?: string) => {
    if (!aiSdk5Config.enableDataParts) return;

    // Add timestamp if not present
    const enrichedDataPart = {
      ...dataPart,
      id: dataPart.id || `${Date.now()}-${Math.random()}`,
      timestamp: dataPart.timestamp || new Date(),
    };

    // If we have a message ID, update that specific message with the data part
    if (messageId) {
      const currentMessages = useChatStore.getState().geminiMessages;
      const messageIndex = currentMessages.findIndex(m => m.id === messageId);
      
      if (messageIndex >= 0) {
        const updatedMessage = {
          role: currentMessages[messageIndex].role,
          text: currentMessages[messageIndex].text,
          dataParts: [...(currentMessages[messageIndex].dataParts || []), enrichedDataPart as SupportedDataPart],
        };
        chatActions.replaceMessage(messageId, updatedMessage);
      }
    } else {
      // Create a new system message with the data part for status updates
      chatActions.addMessage({
        role: 'system',
        text: `Status: ${enrichedDataPart.type}`,
        dataParts: [enrichedDataPart as SupportedDataPart],
      });
    }
  }, [chatActions]);

  const {
    handleObsActionWithDataParts,
    handleStreamerBotActionWithDataParts,
    buildObsSystemMessage,
  } = useObsActions({
    obsService: obs,
    obsData,
    onRefreshData: onRefreshData || (() => Promise.resolve()),
    setErrorMessage,
    emitDataPart,
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [useGoogleSearch, setUseGoogleSearch] = useState<boolean>(false);
  const [contextMessages, setContextMessages] = useState<string[]>([]);

  const handleAddToContext = useCallback((text: string) => {
    setContextMessages((prev) => [...prev, text].slice(-5));
  }, []);
  const handleRegenerate = useCallback(async (messageId: string, onChatInputChange: (value: string) => void, currentHandleSend: (chatInputValue: string, onChatInputChange: (value: string) => void) => Promise<void>) => {
    try {
      setIsLoading(true);
      const messages = useChatStore.getState().geminiMessages;
      const messageToRegenerate = messages.find(msg => msg.id === messageId);
  
      if (!messageToRegenerate || messageToRegenerate.role !== 'model') {
        logger.warn('Attempted to regenerate a non-model message or a message not found:', messageId);
        setIsLoading(false);
        return;
      }
  
      // Find the last user message before the message to regenerate
      const userMessages = messages.filter(msg => msg.role === 'user' && msg.id < messageId);
      const lastUserMessage = userMessages[userMessages.length - 1];
  
      if (!lastUserMessage) {
        logger.warn('No preceding user message found to regenerate from.');
        setIsLoading(false);
        return;
      }
  
      // Remove messages from the last user message onwards (inclusive of the user message)
      const startIndex = messages.findIndex(msg => msg.id === lastUserMessage.id);
      if (startIndex !== -1) {
        chatActions.removeMessagesFrom(startIndex);
      }
  
      // Re-send the last user message
      await currentHandleSend(lastUserMessage.text, onChatInputChange);
    } catch (error) {
      const errorMsg = handleAppError('Gemini chat regenerate', error, 'Failed to regenerate message');
      useErrorStore.getState().addError({
        message: errorMsg,
        source: 'useGeminiChat',
        level: 'error',
        details: { messageId, error }
      });
      logger.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [chatActions]);


  const handleSend = useCallback(async (
    chatInputValue: string,
    onChatInputChange: (value: string) => void,
    streamingHandlers?: StreamingHandlers
  ) => {
    if (!chatInputValue.trim() || isLoading) return;

    const userMessageText = chatInputValue.trim();
    setIsLoading(true);
    onChatInputChange('');
    chatActions.addMessage({ role: 'user', text: userMessageText });

    const modelMessageId = `${Date.now()}-model`;
    chatActions.addMessage({ role: 'model', text: '...', id: modelMessageId });

    try {
      // 1. Get full OBS state
      const obsState = await obsClient.getFullState();

      // 2. Decide on caching strategy
      const useExplicitCache = obsState.available_scenes.length >= 3;

      // 3. Call the new caching-aware AI service
      const result = await aiService.queryWithOBSContext({
        prompt: userMessageText,
        obs_state: obsState,
        use_explicit_cache: useExplicitCache,
        model: 'gemini-1.5-flash-001',
      });

      const fullResponse = result.response;

      // 4. Process the response (action parsing)
      let displayText = fullResponse;
      let obsActionResult: { success: boolean; message: string; error?: string } | null = null;

      try {
        const jsonMatch = fullResponse.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          const parsed: GeminiActionResponse = JSON.parse(jsonMatch[1]);
          if (parsed.obsAction && isConnected) {
            const actions = Array.isArray(parsed.obsAction) ? parsed.obsAction : [parsed.obsAction];
            for (const action of actions) {
              obsActionResult = await handleObsActionWithDataParts(action, streamingHandlers);
              if (!obsActionResult.success) break;
            }
            if (onRefreshData) await onRefreshData();
          }
          if (parsed.responseText) {
            displayText = parsed.responseText;
          }
        }
      } catch (err) {
        logger.warn('No valid action found in response:', err);
      }

      // 5. Update the UI with the final response
      chatActions.replaceMessage(modelMessageId, { role: 'model', text: displayText });

      // Add a system message for the result of the OBS action
      if (obsActionResult) {
        const message = obsActionResult.success ? obsActionResult.message : `OBS Action failed: ${obsActionResult.error}`;
        chatActions.addMessage({ role: 'system', text: message });
      }

      // Optionally, add a system message indicating cache status for debugging
      if (result.cache_used) {
        const cacheInfo = `Cache hit: ${result.cache_name}. Tokens saved: ${result.usage_metadata.cached_content_token_count}`;
        chatActions.addMessage({ role: 'system', text: `[DEBUG] ${cacheInfo}` });
      }

    } catch (error: unknown) {
      const errorMsg = handleAppError('Gemini chat send', error, 'Failed to send message to Gemini');
      useErrorStore.getState().addError({
        message: errorMsg,
        source: 'useGeminiChat',
        level: 'error',
        details: { userMessage: userMessageText, error }
      });
      chatActions.replaceMessage(modelMessageId, { role: 'system', text: `API Error: ${errorMsg}` });
      logger.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isConnected, chatActions, setErrorMessage, onRefreshData, handleObsActionWithDataParts]);

  return {
    isLoading,
    useGoogleSearch,
    setUseGoogleSearch,
    contextMessages,
    handleAddToContext,
    handleSend,
    handleObsAction: handleObsActionWithDataParts,
    handleRegenerate, // Expose handleRegenerate
    // AI SDK 5 compatibility methods
    emitDataPart,
    isDataPartsEnabled: aiSdk5Config.enableDataParts,
  };
};
