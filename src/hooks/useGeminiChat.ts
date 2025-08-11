import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import useConnectionsStore from '@/store/connectionsStore';
import { useChatStore } from '@/store/chatStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useLockStore } from '@/store/lockStore';
import { GEMINI_MODEL_NAME, INITIAL_SYSTEM_PROMPT } from '@/constants';
import { buildMarkdownStylingSystemMessage } from '@/utils/systemPrompts';
import { detectChoiceQuestion } from '@/utils/choiceDetection';
import type { GeminiActionResponse } from '@/types/obsActions';
import { logger } from '@/utils/logger';
import { OBSScene, OBSSource } from '@/types';
import { useObsActions } from './useObsActions';

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
  const { handleObsAction } = useObsActions();

  const geminiApiKey = useChatStore((state) => state.geminiApiKey);
  const userDefinedContext = useChatStore((state) => state.userDefinedContext);
  const chatActions = useChatStore((state) => state.actions);
  const autoApplySuggestions = useSettingsStore((state) => state.autoApplySuggestions);
  const { isLocked } = useLockStore();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [useGoogleSearch, setUseGoogleSearch] = useState<boolean>(false);
  const [contextMessages, setContextMessages] = useState<string[]>([]);
  const ai = useRef<GoogleGenerativeAI | null>(null);

  useEffect(() => {
    if (geminiApiKey) {
      try {
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        ai.current = genAI;
        chatActions.setGeminiClientInitialized(true);
      } catch (error) {
        console.error("Failed to initialize Gemini AI", error);
        chatActions.setGeminiInitializationError('Failed to initialize Gemini AI client.');
      }
    }
  }, [geminiApiKey, chatActions]);

  const handleAddToContext = useCallback((text: string) => {
    setContextMessages((prev) => [...prev, text].slice(-5));
  }, []);

  const handleSend = async (chatInputValue: string, onChatInputChange: (value: string) => void) => {
    if (!chatInputValue.trim() || !ai.current || isLoading) return;

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
    chatActions.addMessage({ role: 'user', text: userMessageText });

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

      const model = ai.current.getGenerativeModel({ model: GEMINI_MODEL_NAME });
      const result = await model.generateContent(`${systemPrompt}${contextPrompt}\n\n${userMessageText}`);
      const response = await result.response;
      const modelResponseText = response.text();

      let displayText = modelResponseText;
      let obsActionResult: { success: boolean; message: string; error?: string } | null = null;

      try {
        const jsonMatch = modelResponseText.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          const parsed: GeminiActionResponse = JSON.parse(jsonMatch[1]);
          if (parsed.obsAction && isConnected) {
            obsActionResult = await handleObsAction(parsed.obsAction);
            await onRefreshData();
          }
          if (parsed.streamerBotAction) {
            await onStreamerBotAction(parsed.streamerBotAction);
          }
          if (parsed.responseText) {
            displayText = parsed.responseText;
          }
        }
      } catch (err) {
        logger.warn('No valid action found in response:', err);
      }

      const choiceDetection = detectChoiceQuestion(displayText, obsData);
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
    } catch (error: unknown) {
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
    ai,
  };
};
