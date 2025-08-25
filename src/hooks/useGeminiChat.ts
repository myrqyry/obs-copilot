import { useState, useCallback } from 'react';
import { geminiService } from '@/services/geminiService';
import useConnectionsStore from '@/store/connectionsStore';
import { useChatStore } from '@/store/chatStore';
import { INITIAL_SYSTEM_PROMPT } from '@/constants';
import { buildMarkdownStylingSystemMessage } from '@/utils/systemPrompts';
import { detectChoiceQuestion } from '@/utils/choiceDetection';
import type { GeminiActionResponse } from '@/types/obsActions';
import { logger } from '@/utils/logger';
import { OBSScene, OBSSource, SupportedDataPart, StreamingHandlers } from '@/types';
import { useObsActions } from './useObsActions';
import { aiSdk5Config } from '@/config';

export const useGeminiChat = (
  onRefreshData: () => Promise<void>,
  setErrorMessage: (message: string | null) => void,
  onStreamerBotAction: (action: { type: string; args?: Record<string, unknown> }) => Promise<void>,
) => {
  const isConnected = useConnectionsStore((state) => state.isConnected);
  const scenes = useConnectionsStore((state) => state.scenes);
  const currentProgramScene = useConnectionsStore((state) => state.currentProgramScene);
  const sources = useConnectionsStore((state) => state.sources);
  const streamStatus = useConnectionsStore((state) => state.streamStatus);
  const recordStatus = useConnectionsStore((state) => state.recordStatus);
  const videoSettings = useConnectionsStore((state) => state.videoSettings);
  const obsService = useConnectionsStore((state) => state.obsServiceInstance);

  const userDefinedContext = useChatStore((state) => state.userDefinedContext);
  const chatActions = useChatStore((state) => state.actions);

  const obsData = {
    scenes,
    currentProgramScene,
    sources,
    streamStatus,
    recordStatus,
    videoSettings,
  };

  const { handleObsAction } = useObsActions({
    obsService,
    obsData,
    onRefreshData,
    onAddMessage: chatActions.addMessage,
    setErrorMessage,
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [useGoogleSearch, setUseGoogleSearch] = useState<boolean>(false);
  const [contextMessages, setContextMessages] = useState<string[]>([]);

  const handleAddToContext = useCallback((text: string) => {
    setContextMessages((prev) => [...prev, text].slice(-5));
  }, []);

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
          ...currentMessages[messageIndex],
          dataParts: [...(currentMessages[messageIndex].dataParts || []), enrichedDataPart],
        };
        chatActions.replaceMessage(messageId, updatedMessage);
      }
    } else {
      // Create a new system message with the data part for status updates
      chatActions.addMessage({
        role: 'system',
        text: `Status: ${enrichedDataPart.type}`,
        dataParts: [enrichedDataPart],
      });
    }
  }, [chatActions]);

  // Enhanced OBS action handler with data parts
  const handleObsActionWithDataParts = useCallback(async (
    action: any, 
    streamingHandlers?: StreamingHandlers
  ) => {
    if (aiSdk5Config.enableDataParts) {
      // Emit pending status
      const pendingDataPart: SupportedDataPart = {
        type: 'obs-action',
        value: {
          action: action.action,
          target: action.sceneName || action.sourceName,
          status: 'pending',
        },
      };
      
      emitDataPart(pendingDataPart);
      streamingHandlers?.onData?.(pendingDataPart);

      // Emit executing status
      const executingDataPart: SupportedDataPart = {
        type: 'obs-action',
        value: {
          action: action.action,
          target: action.sceneName || action.sourceName,
          status: 'executing',
        },
      };
      
      emitDataPart(executingDataPart);
      streamingHandlers?.onData?.(executingDataPart);
    }

    // Execute the actual action
    const result = await handleObsAction(action);

    if (aiSdk5Config.enableDataParts) {
      // Emit completed/error status
      const completedDataPart: SupportedDataPart = {
        type: 'obs-action',
        value: {
          action: action.action,
          target: action.sceneName || action.sourceName,
          status: result.success ? 'completed' : 'error',
          result,
        },
      };
      
      emitDataPart(completedDataPart);
      streamingHandlers?.onData?.(completedDataPart);
    }

    return result;
  }, [handleObsAction, emitDataPart]);

  // Enhanced Streamer.bot action handler with data parts
  const handleStreamerBotActionWithDataParts = useCallback(async (
    action: { type: string; args?: Record<string, unknown> },
    streamingHandlers?: StreamingHandlers
  ) => {
    if (aiSdk5Config.enableDataParts) {
      // Emit pending status
      const pendingDataPart: SupportedDataPart = {
        type: 'streamerbot-action',
        value: {
          action: action.type,
          args: action.args,
          status: 'pending',
        },
      };
      
      emitDataPart(pendingDataPart);
      streamingHandlers?.onData?.(pendingDataPart);

      // Emit executing status
      const executingDataPart: SupportedDataPart = {
        type: 'streamerbot-action',
        value: {
          action: action.type,
          args: action.args,
          status: 'executing',
        },
      };
      
      emitDataPart(executingDataPart);
      streamingHandlers?.onData?.(executingDataPart);
    }

    try {
      // Execute the actual action
      await onStreamerBotAction(action);

      if (aiSdk5Config.enableDataParts) {
        // Emit completed status
        const completedDataPart: SupportedDataPart = {
          type: 'streamerbot-action',
          value: {
            action: action.type,
            args: action.args,
            status: 'completed',
            result: { success: true },
          },
        };
        
        emitDataPart(completedDataPart);
        streamingHandlers?.onData?.(completedDataPart);
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (aiSdk5Config.enableDataParts) {
        // Emit error status
        const errorDataPart: SupportedDataPart = {
          type: 'streamerbot-action',
          value: {
            action: action.type,
            args: action.args,
            status: 'error',
            result: { 
              success: false, 
              error: errorMessage 
            },
          },
        };
        
        emitDataPart(errorDataPart);
        streamingHandlers?.onData?.(errorDataPart);
      }

      return { success: false, error: errorMessage };
    }
  }, [onStreamerBotAction, emitDataPart]);

  const handleSend = async (
    chatInputValue: string, 
    onChatInputChange: (value: string) => void,
    streamingHandlers?: StreamingHandlers
  ) => {
    if (!chatInputValue.trim() || isLoading) return;

    const userMessageText = chatInputValue.trim();
    const hasObsIntent =
      /\b(scene|source|filter|stream|record|obs|hide|show|volume|mute|transition)\b/i.test(
        userMessageText,
      );

    if (!isConnected && hasObsIntent && !useGoogleSearch) {
      chatActions.addMessage({
        role: 'system',
        text: "Hey! I'm not connected to OBS right now, so I can't perform that OBS action. Please connect OBS and try again when you're ready.",
      });
      return;
    }

    setIsLoading(true);
    onChatInputChange('');
    // add user message (store assigns id internally)
    chatActions.addMessage({ role: 'user', text: userMessageText });

    // Emit processing status if data parts are enabled
    if (aiSdk5Config.enableDataParts) {
      const processingDataPart: SupportedDataPart = {
        type: 'status',
        value: {
          message: 'Processing your request...',
          status: 'in-progress',
          progress: 0,
        },
      };
      
      emitDataPart(processingDataPart);
      streamingHandlers?.onData?.(processingDataPart);
    }

    try {
      const obsData = {
        scenes,
        currentProgramScene,
        sources,
        streamStatus,
        recordStatus,
        videoSettings,
      };
      const buildObsSystemMessage = () => {
        const sceneNames = obsData.scenes.map((s: OBSScene) => s.sceneName).join(', ');
        const sourceNames = obsData.sources.map((s: OBSSource) => s.sourceName).join(', ');
        const currentScene = obsData.currentProgramScene || 'None';
        const streamStatusText = obsData.streamStatus?.outputActive ? `Active` : 'Inactive';
        const recordStatusText = obsData.recordStatus?.outputActive ? `Recording` : 'Not Recording';
        const videoRes = obsData.videoSettings
          ? `${obsData.videoSettings.baseWidth}x${obsData.videoSettings.baseHeight}`
          : 'Unknown';

        return `
**OBS Context:**
- Current Scene: ${currentScene}
- Available Scenes: ${sceneNames}
- Available Sources: ${sourceNames}
- Stream Status: ${streamStatusText}
- Record Status: ${recordStatusText}
- Video Resolution: ${videoRes}
`;
      };

      const baseSystemPrompt = `${INITIAL_SYSTEM_PROMPT}\n\n${buildObsSystemMessage()}\n\n${buildMarkdownStylingSystemMessage()}`;
      const systemPrompt = useGoogleSearch
        ? `${baseSystemPrompt}\n\nYou can also use Google Search.`
        : baseSystemPrompt;

      let contextPrompt = '';
      if (userDefinedContext && userDefinedContext.length > 0) {
        contextPrompt += `\n\nMemory Context (user-defined):\n${userDefinedContext.join('\n')}\n`;
      }
      if (contextMessages.length > 0) {
        contextPrompt += `\nContext from previous messages:\n${contextMessages.join('\n')}\n`;
      }

      // Emit AI processing status
      if (aiSdk5Config.enableDataParts) {
        const aiProcessingDataPart: SupportedDataPart = {
          type: 'status',
          value: {
            message: 'Gemini is generating response...',
            status: 'in-progress',
            progress: 25,
          },
        };
        
        emitDataPart(aiProcessingDataPart);
        streamingHandlers?.onData?.(aiProcessingDataPart);
      }

      const fullPrompt = `${systemPrompt}${contextPrompt}\n\n${userMessageText}`;
      const response = await geminiService.generateContent(fullPrompt);
      const modelResponseText = response.text || '';

      let displayText = modelResponseText;
      let obsActionResult: { success: boolean; message: string; error?: string } | null = null;
      let streamerBotResult: { success: boolean; error?: string } | null = null;

      // Emit action parsing status
      if (aiSdk5Config.enableDataParts) {
        const parsingDataPart: SupportedDataPart = {
          type: 'status',
          value: {
            message: 'Parsing actions from response...',
            status: 'in-progress',
            progress: 50,
          },
        };
        
        emitDataPart(parsingDataPart);
        streamingHandlers?.onData?.(parsingDataPart);
      }

      try {
        const jsonMatch = modelResponseText.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          const parsed: GeminiActionResponse = JSON.parse(jsonMatch[1]);
          if (parsed.obsAction && isConnected) {
            const actions = Array.isArray(parsed.obsAction) ? parsed.obsAction : [parsed.obsAction];
            for (const action of actions) {
              obsActionResult = await handleObsActionWithDataParts(action, streamingHandlers);
              // If one action fails, we might want to stop
              if (!obsActionResult.success) {
                break;
              }
            }
            await onRefreshData();
          }
          if (parsed.streamerBotAction) {
            streamerBotResult = await handleStreamerBotActionWithDataParts(parsed.streamerBotAction, streamingHandlers);
          }
          if (parsed.responseText) {
            displayText = parsed.responseText;
          }
        }
      } catch (err) {
        logger.warn('No valid action found in response:', err);
      }

      // Emit completion status
      if (aiSdk5Config.enableDataParts) {
        const completionDataPart: SupportedDataPart = {
          type: 'status',
          value: {
            message: 'Response completed',
            status: 'completed',
            progress: 100,
          },
        };
        
        emitDataPart(completionDataPart);
        streamingHandlers?.onData?.(completionDataPart);
      }
      
      const choiceDetection = detectChoiceQuestion(displayText, obsData);
      // Determine list length before adding the model message
      const beforeCount = useChatStore.getState().geminiMessages.length;
      // Add model message (store assigns id internally)
      if (choiceDetection.hasChoices) {
        chatActions.addMessage({
          role: 'model',
          text: choiceDetection.cleanText,
          type: 'choice-prompt',
          choices: choiceDetection.choices,
          choiceType: choiceDetection.choiceType,
        });
      } else {
        chatActions.addMessage({ role: 'model', text: displayText });
      }
      // Fetch the added message and pass it to onComplete for streaming compatibility
      if (streamingHandlers?.onComplete) {
        const afterMessages = useChatStore.getState().geminiMessages;
        const added = afterMessages[beforeCount]; // the newly appended message
        if (added) {
          streamingHandlers.onComplete(added);
        }
      }

      if (obsActionResult) {
        if (obsActionResult.success) {
          chatActions.addMessage({
            role: 'system',
            text: `{{success:${obsActionResult.message}}}`,
          });
        } else {
          chatActions.addMessage({
            role: 'system',
            text: `{{error:OBS Action failed: ${obsActionResult.error}}}`,
          });
          setErrorMessage(`OBS Action failed: ${obsActionResult.error}`);
        }
      }

      if (streamerBotResult && !streamerBotResult.success) {
        chatActions.addMessage({
          role: 'system',
          text: `{{error:Streamer.bot Action failed: ${streamerBotResult.error}}}`,
        });
        setErrorMessage(`Streamer.bot Action failed: ${streamerBotResult.error}`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (aiSdk5Config.enableDataParts) {
        const errorDataPart: SupportedDataPart = {
          type: 'status',
          value: {
            message: `Error: ${errorMessage}`,
            status: 'error',
            details: errorMessage,
          },
        };
        
        emitDataPart(errorDataPart);
        streamingHandlers?.onError?.(error as Error);
      }

      if (error instanceof Error) {
        chatActions.addMessage({ role: 'system', text: `❗ Gemini API Error: ${error.message}` });
      } else {
        chatActions.addMessage({ role: 'system', text: `❗ Gemini API Error: Unknown error` });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    useGoogleSearch,
    setUseGoogleSearch,
    contextMessages,
    handleAddToContext,
    handleSend,
    handleObsAction: handleObsActionWithDataParts,
    // AI SDK 5 compatibility methods
    emitDataPart,
    isDataPartsEnabled: aiSdk5Config.enableDataParts,
  };
};
