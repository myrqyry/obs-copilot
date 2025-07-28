import { useState, useCallback, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { useConnectionManagerStore } from '../store/connectionManagerStore';
import { useChatStore } from '../store/chatStore';
import { useSettingsStore } from '../store/settingsStore';
import { useLockStore } from '../store/lockStore';
import { GEMINI_MODEL_NAME, INITIAL_SYSTEM_PROMPT } from '../constants';
import { buildMarkdownStylingSystemMessage } from '../utils/systemPrompts';
import { detectChoiceQuestion } from '../utils/choiceDetection';
import type { GeminiActionResponse } from '../types/obsActions';

export const useGeminiChat = (
    onRefreshData: () => Promise<void>,
    setErrorMessage: (message: string | null) => void,
    onStreamerBotAction: (action: { type: string, args?: Record<string, any> }) => Promise<void>
) => {
    const { isConnected } = useConnectionManagerStore();
    const { scenes, currentProgramScene, sources, streamStatus, recordStatus, videoSettings, actions: obsActions } = useConnectionManagerStore();
    const { userDefinedContext, actions: chatActions } = useChatStore();
    const { autoApplySuggestions } = useSettingsStore();
    const { isLocked } = useLockStore();

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [useGoogleSearch, setUseGoogleSearch] = useState<boolean>(false);
    const [contextMessages, setContextMessages] = useState<string[]>([]);
    const ai = useRef<GoogleGenAI | null>(null);

    const handleAddToContext = useCallback((text: string) => {
        setContextMessages(prev => [...prev, text].slice(-5));
    }, []);

    const handleSend = async (chatInputValue: string, onChatInputChange: (value: string) => void) => {
        if (!chatInputValue.trim() || !ai.current || isLoading) return;

        const userMessageText = chatInputValue.trim();
        const hasObsIntent = /\b(scene|source|filter|stream|record|obs|hide|show|volume|mute|transition)\b/i.test(userMessageText);

        if (!isConnected && hasObsIntent && !useGoogleSearch) {
            chatActions.addMessage({ role: 'system', text: "Hey! I'm not connected to OBS right now, so I can't perform that OBS action. Please connect OBS and try again when you're ready." });
            return;
        }

        setIsLoading(true);
        onChatInputChange('');
        chatActions.addMessage({ role: 'user', text: userMessageText });

        try {
            const obsData = { scenes, currentProgramScene, sources, streamStatus, recordStatus, videoSettings };
            const buildObsSystemMessage = () => {
                const sceneNames = obsData.scenes.map((s: any) => s.sceneName).join(', ');
                const sourceNames = obsData.sources.map((s: any) => s.sourceName).join(', ');
                const currentScene = obsData.currentProgramScene || 'None';
                const streamStatusText = obsData.streamStatus?.outputActive ? `Active` : 'Inactive';
                const recordStatusText = obsData.recordStatus?.outputActive ? `Recording` : 'Not Recording';
                const videoRes = obsData.videoSettings ? `${obsData.videoSettings.baseWidth}x${obsData.videoSettings.baseHeight}` : 'Unknown';

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

            const response = await ai.current.models.generateContent({
                model: GEMINI_MODEL_NAME,
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: `${systemPrompt}${contextPrompt}\n\n${userMessageText}` }]
                    }
                ]
            });

            let modelResponseText = response.text || 'No response received';
            let displayText = modelResponseText;
            let obsActionResult: { success: boolean; message: string; error?: string } | null = null;

            try {
                const jsonMatch = modelResponseText.match(/```json\s*([\s\S]*?)\s*```/);
                if (jsonMatch && jsonMatch[1]) {
                    const parsed: GeminiActionResponse = JSON.parse(jsonMatch[1]);
                    if (parsed.obsAction && isConnected) {
                        obsActionResult = await obsActions.handleObsAction(parsed.obsAction);
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
                console.warn('No valid action found in response:', err);
            }

            const choiceDetection = detectChoiceQuestion(displayText, obsData);
            if (choiceDetection.hasChoices) {
                chatActions.addMessage({
                    role: 'model',
                    text: choiceDetection.cleanText,
                    type: 'choice-prompt',
                    choices: choiceDetection.choices,
                    choiceType: choiceDetection.choiceType
                });
            } else {
                chatActions.addMessage({ role: 'model', text: displayText });
            }

            if (obsActionResult) {
                if (obsActionResult.success) {
                    chatActions.addMessage({ role: 'system', text: `{{success:${obsActionResult.message}}}` });
                } else {
                    chatActions.addMessage({ role: 'system', text: `{{error:OBS Action failed: ${obsActionResult.error}}}` });
                    setErrorMessage(`OBS Action failed: ${obsActionResult.error}`);
                }
            }
        } catch (error: any) {
            chatActions.addMessage({ role: 'system', text: `❗ Gemini API Error: ${error.message}` });
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
