import { useState, useCallback, useEffect, useMemo } from 'react';
import { aiService } from '@/shared/services/aiService';
import { obsClient } from '@/shared/services/obsClient';
import useConnectionsStore from '@/app/store/connections';
import { useChatStore } from '@/app/store/chatStore';
import { INITIAL_SYSTEM_PROMPT } from '@/shared/constants';
import { buildMarkdownStylingSystemMessage } from '@/shared/utils/systemPrompts';
import { logger } from '@/shared/utils/logger';
import { handleAppError } from '@/shared/lib/errorUtils';
import { useErrorStore } from '@/app/store/errorStore'; // Import useErrorStore
import type { GeminiActionResponse, ObsAction, StreamingHandlers, SupportedDataPart } from '@/shared/types/obsActions';
import { OBSScene, OBSSource } from '@/shared/types';

import { useObsActions } from './useObsActions';
import { obsActionValidator } from '@/shared/services/obsActionValidator';
import { obsActionExecutor } from '@/shared/services/obsActionExecutor';
import { obsStateManager } from '@/shared/services/obsStateManager';

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

  const {
    handleObsAction,
    buildObsSystemMessage,
  } = useObsActions({
    obsData,
    onRefreshData: onRefreshData || (() => Promise.resolve()),
    setErrorMessage,
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
      useErrorStore().addError({
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
      const stateWithChanges = await obsStateManager.getStateWithChanges();

      const result = await aiService.queryWithOBSContext({
        prompt: userMessageText,
        obs_state: stateWithChanges.full_state,
        state_changes: stateWithChanges.changes,
        recent_changes: stateWithChanges.recent_changes,
        is_first_query: stateWithChanges.is_first_query,
        model: 'gemini-1.5-flash-001',
      });

      // The 'result' is now a well-typed OBSActionResponse object.
      const { actions, reasoning } = result;

      // Update the UI with the model's reasoning.
      chatActions.replaceMessage(modelMessageId, { role: 'model', text: reasoning });

      // Execute the actions with validation and transaction semantics
      if (actions && actions.length > 0 && isConnected) {
        const obsActions = actions.map(a => ({ type: a.command, ...(a.args || {}) })) as ObsAction[];

        // Validate actions before execution
        const validation = await obsActionValidator.validateBatch(obsActions, stateWithChanges.full_state);
        if (!validation.valid) {
          const errorMessages = validation.errors.map(e => 
            `• ${e.action.type}: ${e.error}${e.suggestion ? ` (Suggestion: ${e.suggestion})` : ''}`
          ).join('\n');
          
          chatActions.replaceMessage(modelMessageId, { 
            role: 'system', 
            text: `❌ Action validation failed:\n${errorMessages}` 
          });
          setIsLoading(false);
          return;
        }

        if (validation.warnings.length > 0) {
          const warningText = validation.warnings.map(w => `⚠️ ${w.warning}`).join('\n');
          chatActions.addMessage({ role: 'system', text: warningText });
        }

        // Execute with transaction support
        chatActions.addMessage({ role: 'system', text: `⚙️ Executing ${actions.length} action(s)...` });
        const executionResult = await obsActionExecutor.executeActionsWithTransaction(
          obsActions,
          (action) => handleObsAction(action, streamingHandlers),
          stateWithChanges.full_state,
          (completed, total, currentAction) => {
            chatActions.replaceMessage(modelMessageId, { role: 'model', text: `${reasoning}\n\n⚙️ Progress: ${completed}/${total} - ${currentAction}` });
          }
        );

        if (executionResult.success) {
          chatActions.addMessage({ role: 'system', text: '✅ All actions completed successfully!' });
          chatActions.replaceMessage(modelMessageId, { role: 'model', text: reasoning });
        } else {
          chatActions.addMessage({ 
            role: 'system', 
            text: `❌ ${executionResult.error}` 
          });
          chatActions.replaceMessage(
            modelMessageId, 
            { role: 'model', text: `${reasoning}\n\n❌ Execution failed at action ${(executionResult.failedAt ?? 0) + 1}` }
          );
        }

        // Refresh OBS data after actions
        if (onRefreshData) {
          await onRefreshData();
        }
      }
    } catch (error: unknown) {
      const errorMsg = handleAppError('Gemini chat send', error, 'Failed to send message to Gemini');
      useErrorStore().addError({
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
  }, [isLoading, isConnected, chatActions, setErrorMessage, onRefreshData, handleObsAction]);

  return {
    isLoading,
    useGoogleSearch,
    setUseGoogleSearch,
    contextMessages,
    handleAddToContext,
    handleSend,
    handleObsAction: handleObsAction,
    handleRegenerate, // Expose handleRegenerate
  };
};
