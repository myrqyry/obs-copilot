import Tooltip from './ui/Tooltip';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GlobeAltIcon, CameraIcon } from '@heroicons/react/24/solid';
import { GoogleGenAI } from '@google/genai';
import { Button } from './common/Button';
import { LoadingSpinner } from './common/LoadingSpinner';
import { ChatMessageItem } from './chat/ChatMessageItem';
// Removed useObsActions import - now using store directly
import { GEMINI_MODEL_NAME, INITIAL_SYSTEM_PROMPT } from '../constants';
import { buildMarkdownStylingSystemMessage } from '../utils/systemPrompts';
import { detectChoiceQuestion } from '../utils/choiceDetection';
import {
  ChatMessage,
  CatppuccinAccentColorName,
  AppTab
} from '../types';
import type {
  GeminiActionResponse
} from '../types/obsActions';
import { useAppStore } from '../store/appStore';
import { useLockStore } from '../store/lockStore';
import { logoAnimations, triggerTextSplitOnSend } from '../utils/gsapAnimations';

interface GeminiChatProps {
  geminiApiKeyFromInput?: string;
  streamerBotService: any;
  onRefreshData: () => Promise<void>;
  setErrorMessage: (message: string | null) => void;
  chatInputValue: string;
  onChatInputChange: (value: string) => void;
  accentColorName?: CatppuccinAccentColorName;
  messages: ChatMessage[];
  onAddMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  isGeminiClientInitialized: boolean;
  geminiInitializationError: string | null;
  onSetIsGeminiClientInitialized: (status: boolean) => void;
  onSetGeminiInitializationError: (error: string | null) => void;
  activeTab: AppTab;
  onStreamerBotAction: (action: { type: string, args?: Record<string, any> }) => Promise<void>;
}

export const GeminiChat: React.FC<GeminiChatProps> = ({
  geminiApiKeyFromInput,
  streamerBotService,
  onRefreshData,
  setErrorMessage,
  chatInputValue,
  onChatInputChange,
  accentColorName,
  messages,
  onAddMessage,
  isGeminiClientInitialized,
  // geminiInitializationError,
  onSetIsGeminiClientInitialized,
  onSetGeminiInitializationError,
  onStreamerBotAction,
}) => {
  // Merge all needed state into a single useAppStore call for efficiency

  const {
    userSettings: {
      bubbleFillOpacity,
      backgroundOpacity,
      extraDarkMode,
      customChatBackground,
      autoApplySuggestions,
      flipSides,
    },
    chatBackgroundBlendMode,
    scenes,
    currentProgramScene,
    sources,
    streamStatus,
    recordStatus,
    videoSettings,
    actions,
    isConnected,
    userDefinedContext,
  } = useAppStore();

  const userChatBubbleColorName = useAppStore(state => state.theme.userChatBubble);
  const modelChatBubbleColorName = useAppStore(state => state.theme.modelChatBubble);
  const obsData = { scenes, currentProgramScene, sources, streamStatus, recordStatus, videoSettings };
  const { isLocked } = useLockStore();

  // Visual indicator for context
  const hasContext = userDefinedContext && userDefinedContext.length > 0;

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [useGoogleSearch, setUseGoogleSearch] = useState<boolean>(false);
  const [contextMessages, setContextMessages] = useState<string[]>([]);
  const [isGeminiInitializing, setIsGeminiInitializing] = useState<boolean>(false);
  const [streamerBotActions, setStreamerBotActions] = useState<{ id: string; name: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ai = useRef<GoogleGenAI | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  // Handle adding messages to context
  const handleAddToContext = useCallback((text: string) => {
    setContextMessages(prev => [...prev, text].slice(-5)); // Keep last 5 context messages
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Enhancement 6: Show progress indicator during Gemini initialization
  useEffect(() => {
    if (geminiApiKeyFromInput) {
      setIsGeminiInitializing(true);
      setTimeout(() => {
        try {
          ai.current = new GoogleGenAI({ apiKey: geminiApiKeyFromInput });
          onSetIsGeminiClientInitialized(true);
          onSetGeminiInitializationError(null);
        } catch (error) {
          console.error('Gemini client initialization error:', error);
          const errorMsg = `❗ Failed to initialize Gemini: ${(error as Error).message}`;
          onAddMessage({ role: 'system', text: errorMsg });
          onSetIsGeminiClientInitialized(false);
          onSetGeminiInitializationError(errorMsg);
        } finally {
          setIsGeminiInitializing(false);
        }
      }, 500); // Simulate loading for UX
    } else {
      onSetIsGeminiClientInitialized(false);
      onSetGeminiInitializationError('❗ Missing Gemini API key. Please provide a valid API key to use Gemini features.');
      setIsGeminiInitializing(false);
    }
  }, [geminiApiKeyFromInput, onSetIsGeminiClientInitialized, onSetGeminiInitializationError, onAddMessage]);

  // Enhancement 8: Fetch Streamer.bot actions for suggestions
  useEffect(() => {
    async function fetchStreamerBotActions() {
      try {
        if (streamerBotService && typeof streamerBotService.getActions === 'function') {
          const actions = await streamerBotService.getActions();
          if (Array.isArray(actions)) {
            setStreamerBotActions(actions);
          }
        }
      } catch (e) {
        // Ignore errors
      }
    }
    fetchStreamerBotActions();
  }, [streamerBotService]);

  const buildObsSystemMessage = useCallback(() => {
    const sceneNames = obsData.scenes.map((s: any) => s.sceneName).join(', ');
    const sourceNames = obsData.sources.map((s: any) => s.sourceName).join(', ');
    const currentScene = obsData.currentProgramScene || 'None';

    // Fix stream and record status to check outputActive property
    const streamStatus = obsData.streamStatus?.outputActive
      ? `Active (${Math.floor((obsData.streamStatus.outputDuration || 0) / 60)}:${((obsData.streamStatus.outputDuration || 0) % 60).toString().padStart(2, '0')})`
      : 'Inactive';

    const recordStatus = obsData.recordStatus?.outputActive
      ? `Recording (${Math.floor((obsData.recordStatus.outputDuration || 0) / 60)}:${((obsData.recordStatus.outputDuration || 0) % 60).toString().padStart(2, '0')})`
      : 'Not Recording';

    const videoRes = obsData.videoSettings ? `${obsData.videoSettings.baseWidth}x${obsData.videoSettings.baseHeight}` : 'Unknown';

    return `
**OBS Context:**
- Current Scene: ${currentScene}
- Available Scenes: ${sceneNames}
- Available Sources: ${sourceNames}
- Stream Status: ${streamStatus}
- Record Status: ${recordStatus}
- Video Resolution: ${videoRes}

When user asks for OBS actions, respond with a JSON object in your response containing an "obsAction" field. Example:
{
  "obsAction": {
    "type": "createInput",
    "inputName": "My Text",
    "inputKind": "text_gdiplus_v2",
    "inputSettings": {"text": "Hello World"},
    "sceneName": "Scene Name",
    "sceneItemEnabled": true
  }
}

Use these action types: createInput, setInputSettings, setSceneItemEnabled, getInputSettings, getSceneItemList, setCurrentProgramScene, setVideoSettings, createScene, removeInput, setSceneItemTransform, createSourceFilter, setInputVolume, setInputMute, etc.
`;
  }, [obsData]);

  // In src/components/GeminiChat.tsx  // Add this function alongside your existing buildObsSystemMessage const buildStreamerBotSystemMessage = useCallback(() => {   // In the future, we can dynamically fetch and cache actions from Streamer.bot here   // For now, we'll provide a static guide.   return ` **Streamer.bot Context:** - You can control Streamer.bot to perform complex stream automation. - To do this, respond with a JSON object containing a "streamerBotAction" field. - The `type` should be the Streamer.bot request name (e.g., 'DoAction', 'GetActions'). - The `args` object contains the parameters for that request.  **Key Action Types:** 1.  **DoAction**: To run an existing action. Use the action's name or ID.     - Example: { "streamerBotAction": { "type": "DoAction", "args": { "action": { "name": "My Cool Action" } } } } 2.  **CreateAction**: To create a new, simple action.     - Example: { "streamerBotAction": { "type": "CreateAction", "args": { "name": "New Greeting" } } }     - (Note: Complex action creation requires multiple steps) 3.  **Twitch Actions**: Streamer.bot has built-in Twitch actions. You can call them directly.     - **Create Poll**: { "streamerBotAction": { "type": "DoAction", "args": { "action": { "name": "Twitch Create Poll" }, "args": { "title": "Poll Title", "choices": ["A", "B"], "duration": 120 } } } }     - **Send Chat Message**: { "streamerBotAction": { "type": "DoAction", "args": { "action": { "name": "Twitch Send Message" }, "args": { "message": "Hello from the bot!" } } } }  When a user asks for a Streamer.bot action, use this format. `; }, []);
  const buildStreamerBotSystemMessage = useCallback(() => {
    // In the future, we can dynamically fetch and cache actions from Streamer.bot here
    // For now, we'll provide a static guide.
    return `
**Streamer.bot Context:**
- You can control Streamer.bot to perform complex stream automation.
- To do this, respond with a JSON object containing a "streamerBotAction" field.
- The \`type\` should be the Streamer.bot request name (e.g., 'DoAction', 'GetActions').
- The \`args\` object contains the parameters for that request.

**Key Action Types:**
1.  **DoAction**: To run an existing action. Use the action's name or ID.
    - Example: { "streamerBotAction": { "type": "DoAction", "args": { "action": { "name": "My Cool Action" } } } }
2.  **CreateAction**: To create a new, simple action.
    - Example: { "streamerBotAction": { "type": "CreateAction", "args": { "name": "New Greeting" } } }
    - (Note: Complex action creation requires multiple steps)
3.  **Twitch Actions**: Streamer.bot has built-in Twitch actions. You can call them directly.
    - **Create Poll**: { "streamerBotAction": { "type": "DoAction", "args": { "action": { "name": "Twitch Create Poll" }, "args": { "title": "Poll Title", "choices": ["A", "B"], "duration": 120 } } } }
    - **Send Chat Message**: { "streamerBotAction": { "type": "DoAction", "args": { "action": { "name": "Twitch Send Message" }, "args": { "message": "Hello from the bot!" } } } }

When a user asks for a Streamer.bot action, use this format.
`;
  }, []);

  const handleSend = async () => {
    if (!chatInputValue.trim() || !ai.current || isLoading) return;

    // Trigger text split animation before sending
    const inputElement = chatInputRef.current;

    if (inputElement) {
      // Find the send button element by class or nearby element
      const sendButton = inputElement.parentElement?.querySelector('button[class*="primary"]') as HTMLElement;
      triggerTextSplitOnSend(inputElement, sendButton);
    }

    // Remove the previous limitation - now both OBS and web search can work together
    // Only warn if OBS is not connected AND the user is trying to do OBS actions specifically
    const userMessageText = chatInputValue.trim();
    const hasObsIntent = /\b(scene|source|filter|stream|record|obs|hide|show|volume|mute|transition)\b/i.test(userMessageText);

    if (!isConnected && hasObsIntent && !useGoogleSearch) {
      onAddMessage({ role: 'system', text: "Hey! I'm not connected to OBS right now, so I can't perform that OBS action. Please connect OBS and try again when you're ready." });
      return;
    }

    setIsLoading(true);
    onChatInputChange('');
    onAddMessage({ role: 'user', text: userMessageText });

    try {
      let finalPrompt = userMessageText;
      // Now include both OBS and web search capabilities in the system prompt
      const baseSystemPrompt = `${INITIAL_SYSTEM_PROMPT}\n\n${buildObsSystemMessage()}\n\n${buildStreamerBotSystemMessage()}\n\n${buildMarkdownStylingSystemMessage()}`;
      const systemPrompt = useGoogleSearch
        ? `${baseSystemPrompt}\n\nYou can also use Google Search to find current information when needed. When you need to search for something, include it in your response. You can provide both OBS actions AND web search results in the same response when appropriate.`
        : baseSystemPrompt;

      // Add memory context and local context if available
      let contextPrompt = '';
      if (userDefinedContext && userDefinedContext.length > 0) {
        contextPrompt += `\n\nMemory Context (user-defined):\n${userDefinedContext.join('\n')}\n`;
      }
      if (contextMessages.length > 0) {
        contextPrompt += `\nContext from previous messages:\n${contextMessages.join('\n')}\n`;
      }

      if (useGoogleSearch && !hasObsIntent) {
        finalPrompt = `Please search for information about: ${userMessageText}`;
      }

      const response = await ai.current.models.generateContent({
        model: GEMINI_MODEL_NAME,
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}${contextPrompt}\n\n${finalPrompt}` }]
          }
        ]
      });

      let modelResponseText = response.text || 'No response received';
      let responseSources: any[] | undefined;

      if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        responseSources = response.candidates[0].groundingMetadata.groundingChunks;
      }

      let displayText = modelResponseText;

      // Store OBS action result for later (after adding Gemini response)
      let obsActionResult: { success: boolean; message: string; error?: string } | null = null;

      // Always try to process OBS actions regardless of useGoogleSearch setting
      try {
        // Try to extract a JSON block - be more careful about what we consider valid JSON
        let jsonStr = '';
        let foundValidJson = false;

        // First, try to extract from ```json code blocks
        const codeBlockMatch = modelResponseText.match(/```json\s*\n([\s\S]*?)\n```/);
        if (codeBlockMatch) {
          jsonStr = codeBlockMatch[1].trim();
          foundValidJson = true;
        } else {
          // Look for JSON objects, but be more selective
          // Only match if it looks like it starts with proper JSON structure
          const jsonObjectMatches = modelResponseText.match(/\{\s*["'](?:obsAction|streamerBotAction|responseText)["'][\s\S]*?\}/g);
          if (jsonObjectMatches) {
            // Take the first complete JSON object that contains our expected keys
            for (const match of jsonObjectMatches) {
              try {
                const testParse = JSON.parse(match);
                if (testParse.obsAction || testParse.streamerBotAction || testParse.responseText) {
                  jsonStr = match;
                  foundValidJson = true;
                  break;
                }
              } catch (e) {
                // This match wasn't valid JSON, continue to next
                continue;
              }
            }
          }
        }

        if (foundValidJson && jsonStr) {
          const parsed: GeminiActionResponse = JSON.parse(jsonStr);
          // Enforce lock awareness for Gemini actions
          if (parsed.obsAction && isConnected) {
            // Support both single and array obsAction
            const lockMap: Record<string, string> = {
              startStream: 'streamRecord',
              stopStream: 'streamRecord',
              toggleStream: 'streamRecord',
              startRecord: 'streamRecord',
              stopRecord: 'streamRecord',
              toggleRecord: 'streamRecord',
              setVideoSettings: 'videoSettings',
            };
            const checkLocked = (action: any) => {
              const lockKey = lockMap[action.type];
              return lockKey && isLocked(lockKey);
            };
            if (Array.isArray(parsed.obsAction)) {
              // If any action is locked, block all
              const lockedAction = parsed.obsAction.find(checkLocked);
              if (lockedAction) {
                onAddMessage({ role: 'system', text: "Looks like you've locked this setting, so I won't change it for you. If you want me to help with this, just unlock it in the settings!" });
              } else {
                obsActionResult = await actions.handleObsAction(parsed.obsAction);
                await onRefreshData();
              }
            } else {
              if (checkLocked(parsed.obsAction)) {
                onAddMessage({ role: 'system', text: "Looks like you've locked this setting, so I won't change it for you. If you want me to help with this, just unlock it in the settings!" });
              } else {
                obsActionResult = await actions.handleObsAction(parsed.obsAction);
                await onRefreshData();
              }
            }
          }
          if (parsed.streamerBotAction) {
            await onStreamerBotAction(parsed.streamerBotAction);
          }
          // Prefer responseText for display if present
          if (typeof parsed.responseText === 'string') {
            displayText = parsed.responseText;
          } else if (parsed.obsAction || parsed.streamerBotAction) {
            // Only show JSON if it's purely action-based with no readable response
            displayText = JSON.stringify(parsed, null, 2);
          }
        }
      } catch (err) {
        // If parsing fails, just show the original text
        console.warn('No valid OBS action found in response:', err);
      }

      // For responses that might be JSON artifacts, clean them up
      if (useGoogleSearch || modelResponseText.startsWith('{')) {
        try {
          // Check if the response is pure JSON and try to extract readable content
          const parsed = JSON.parse(modelResponseText);
          if (parsed.responseText || parsed.text || parsed.content) {
            displayText = parsed.responseText || parsed.text || parsed.content;
          } else if (!parsed.obsAction && !parsed.streamerBotAction) {
            // If it's structured data without actions, format it nicely
            displayText = modelResponseText; // Keep original if it's already readable
          }
        } catch (err) {
          // Not JSON, use as-is (which is good for search responses)
          displayText = modelResponseText;
        }
      }

      // Check if the response contains multiple choice questions
      const choiceDetection = detectChoiceQuestion(displayText, obsData);
      if (choiceDetection.hasChoices) {
        onAddMessage({
          role: 'model',
          text: choiceDetection.cleanText,
          sources: responseSources,
          type: 'choice-prompt',
          choices: choiceDetection.choices,
          choiceType: choiceDetection.choiceType
        });
      } else {
        onAddMessage({ role: 'model', text: displayText, sources: responseSources });
      }

      // Enhancement 7: Add visual feedback for OBS actions
      if (obsActionResult) {
        if (obsActionResult.success) {
          onAddMessage({ role: 'system', text: `{{success:${obsActionResult.message}}}` });
        } else {
          onAddMessage({ role: 'system', text: `{{error:OBS Action failed: ${obsActionResult.error}}}` });
          setErrorMessage(`OBS Action failed: ${obsActionResult.error}`);
        }
      }
    } catch (error: any) {
      console.error('Gemini API call failed:', error);
      const errorMessageText = error?.message || 'Unknown error occurred';
      onAddMessage({ role: 'system', text: `❗ Gemini API Error: ${errorMessageText}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async (messageId: string) => {
    if (!ai.current || isLoading) return;

    // Find the message to regenerate
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) return;

    const messageToRegenerate = messages[messageIndex];
    if (messageToRegenerate.role !== 'model') return;

    // Find the last user message before this assistant message
    let userPrompt = '';
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        userPrompt = messages[i].text;
        break;
      }
    }

    if (!userPrompt) return;

    setIsLoading(true);

    try {
      const baseSystemPrompt = `${INITIAL_SYSTEM_PROMPT}\n\n${buildObsSystemMessage()}\n\n${buildMarkdownStylingSystemMessage()}`;
      const systemPrompt = useGoogleSearch
        ? `${baseSystemPrompt}\n\nYou can also use Google Search to find current information when needed. When you need to search for something, include it in your response. You can provide both OBS actions AND web search results in the same response when appropriate.`
        : baseSystemPrompt;

      // Add memory context and local context if available
      let contextPrompt = '';
      if (userDefinedContext && userDefinedContext.length > 0) {
        contextPrompt += `\n\nMemory Context (user-defined):\n${userDefinedContext.join('\n')}\n`;
      }
      if (contextMessages.length > 0) {
        contextPrompt += `\nContext from previous messages:\n${contextMessages.join('\n')}\n`;
      }

      let finalPrompt = userPrompt;
      const hasObsIntent = /\b(scene|source|filter|stream|record|obs|hide|show|volume|mute|transition)\b/i.test(userPrompt);
      if (useGoogleSearch && !hasObsIntent) {
        finalPrompt = `Please search for information about: ${userPrompt}`;
      }

      const response = await ai.current.models.generateContent({
        model: GEMINI_MODEL_NAME,
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}${contextPrompt}\n\n${finalPrompt}` }]
          }
        ]
      });

      let modelResponseText = response.text || 'No response received';
      let responseSources: any[] | undefined;

      // Handle OBS actions if not using Google Search
      let obsActionResult: any = null;
      if (!useGoogleSearch) {
        try {
          // Try to extract a JSON block - be more careful about what we consider valid JSON
          let jsonStr = '';
          let foundValidJson = false;

          // First, try to extract from ```json code blocks
          const codeBlockMatch = modelResponseText.match(/```json\s*\n([\s\S]*?)\n```/);
          if (codeBlockMatch) {
            jsonStr = codeBlockMatch[1].trim();
            foundValidJson = true;
          } else {
            // Look for JSON objects, but be more selective
            // Only match if it looks like it starts with proper JSON structure
            const jsonObjectMatches = modelResponseText.match(/\{\s*["'](?:obsAction|streamerBotAction|responseText)["'][\s\S]*?\}/g);
            if (jsonObjectMatches) {
              // Take the first complete JSON object that contains our expected keys
              for (const match of jsonObjectMatches) {
                try {
                  const testParse = JSON.parse(match);
                  if (testParse.obsAction || testParse.streamerBotAction || testParse.responseText) {
                    jsonStr = match;
                    foundValidJson = true;
                    break;
                  }
                } catch (e) {
                  // This match wasn't valid JSON, continue to next
                  continue;
                }
              }
            }
          }

          if (foundValidJson && jsonStr) {
            const parsed: GeminiActionResponse = JSON.parse(jsonStr);
            // Enforce lock awareness for Gemini actions
            if (parsed.obsAction) {
              const lockMap: Record<string, string> = {
                startStream: 'streamRecord',
                stopStream: 'streamRecord',
                toggleStream: 'streamRecord',
                startRecord: 'streamRecord',
                stopRecord: 'streamRecord',
                toggleRecord: 'streamRecord',
                setVideoSettings: 'videoSettings',
              };
              const checkLocked = (action: any) => {
                if (!action || !action.type) return false;
                const lockKey = lockMap[action.type];
                return lockKey && isLocked(lockKey);
              };
              if (Array.isArray(parsed.obsAction)) {
                for (const action of parsed.obsAction) {
                  if (checkLocked(action)) {
                    onAddMessage({ role: 'system', text: `🔒 Action "${action.type}" is locked and cannot be performed right now.` });
                    continue;
                  }
                  // ...handle setCurrentProgramScene or other actions if needed...
                }
              } else {
                if (checkLocked(parsed.obsAction)) {
                  onAddMessage({ role: 'system', text: `🔒 Action "${parsed.obsAction.type}" is locked and cannot be performed right now.` });
                } else {
                  // ...handle setCurrentProgramScene or other actions if needed...
                }
              }
            }
            if (parsed.obsAction !== undefined) {
              obsActionResult = await actions.handleObsAction(parsed.obsAction);
              await onRefreshData();
            }
            if (parsed.streamerBotAction) {
              await onStreamerBotAction(parsed.streamerBotAction);
            }
            // Prefer responseText for display if present
            if (typeof parsed.responseText === 'string') {
              modelResponseText = parsed.responseText;
            } else if (parsed.obsAction || parsed.streamerBotAction) {
              modelResponseText = JSON.stringify(parsed, null, 2);
            }
          }
        } catch (err) {
          // If parsing fails, just show the original text
          console.warn('No valid OBS action found in response:', err);
        }
      }

      // Replace the regenerated message
      actions.replaceMessage(messageId, {
        role: 'model',
        text: modelResponseText,
        sources: responseSources
      });

      // Add OBS action result if any
      if (obsActionResult) {
        onAddMessage({ role: 'system', text: obsActionResult.message });
        if (!obsActionResult.success) {
          setErrorMessage(`OBS Action failed: ${obsActionResult.error}`);
        }
      }

    } catch (error: any) {
      console.error('Error regenerating message:', error);
      const errorMessageText = error?.message || 'Unknown error occurred';
      onAddMessage({ role: 'system', text: `❗ Regeneration failed: ${errorMessageText}` });
    } finally {
      setIsLoading(false);
    }
  };

  const genericSourcePrompts = [
    "Hide a source in the current scene.",
    "Show a source in the current scene.",
    "Set the text of a source in the current scene.",
    "Add a color correction filter to a source.",
    "Get a PNG screenshot of a source in the current scene.",
    "Open the filters dialog for a source."
  ];

  const handleSuggestionClick = (prompt: string) => {
    // Check if this is a choice selection (look for choice patterns in recent messages)
    const recentMessages = messages.slice(-3); // Check last 3 messages
    const hasRecentChoicePrompt = recentMessages.some(msg => msg.type === 'choice-prompt');

    if (hasRecentChoicePrompt) {
      // This is likely a choice selection, add it to context automatically
      handleAddToContext(`User selected: ${prompt}`);
    }

    if (genericSourcePrompts.includes(prompt)) {
      // Create more descriptive messages for different actions
      let actionDescription = "";
      if (prompt.includes("Hide")) {
        actionDescription = "🙈 Hide a source from the current scene";
      } else if (prompt.includes("Show")) {
        actionDescription = "👁️ Show a source in the current scene";
      } else if (prompt.includes("text")) {
        actionDescription = "✏️ Update the text content of a source";
      } else if (prompt.includes("color correction")) {
        actionDescription = "🎨 Add color correction filter to a source";
      } else if (prompt.includes("screenshot")) {
        actionDescription = "📷 Capture a PNG screenshot of a source";
      } else if (prompt.includes("filters dialog")) {
        actionDescription = "🔧 Open the filters dialog for a source";
      } else {
        actionDescription = prompt;
      }

      onAddMessage({
        role: "system",
        text: actionDescription,
        type: "source-prompt",
        sourcePrompt: prompt,
      });
    }

    // For all suggestions, including source prompts, auto-apply if enabled
    if (autoApplySuggestions) {
      onChatInputChange(prompt);
      setTimeout(() => {
        if (!isLoading && isGeminiClientInitialized && prompt.trim()) {
          handleSend();
        }
      }, 100);
    } else {
      onChatInputChange(prompt);
      document.getElementById('gemini-input')?.focus();
    }
  };

  useEffect(() => {
    if (isGeminiClientInitialized && headerRef.current) {
      logoAnimations.geminiSparkle(headerRef.current);
    }
  }, [isGeminiClientInitialized]);

  const validatedBackgroundOpacity = Math.min(Math.max(backgroundOpacity, 0), 1); // Ensure opacity is between 0 and 1
  const validatedCustomChatBackground = customChatBackground || 'none'; // Fallback to 'none' if empty

  useEffect(() => {
    const root = document.documentElement;
    // Update CSS variables dynamically when appearance-related state values change
    root.style.setProperty('--bubble-fill-opacity', bubbleFillOpacity.toString());
    root.style.setProperty('--background-opacity', backgroundOpacity.toString());

    // Adjust text and outline colors based on extraDarkMode and backgroundOpacity
    if (extraDarkMode) {
      // Apply specific colors for extra dark mode
      root.style.setProperty('--text-color', 'rgba(255, 255, 255, 0.7)');
      root.style.setProperty('--outline-color', 'rgba(255, 255, 255, 0.3)');
    } else {
      // Apply dynamic colors based on background opacity
      const adjustedTextColor = `rgba(255, 255, 255, ${backgroundOpacity})`;
      const adjustedOutlineColor = `rgba(255, 255, 255, ${backgroundOpacity * 0.5})`;
      root.style.setProperty('--text-color', adjustedTextColor);
      root.style.setProperty('--outline-color', adjustedOutlineColor);
    }

    // Enhance glass effect to respect opacity slider
    root.style.setProperty('--glass-opacity', backgroundOpacity.toString());
  }, [bubbleFillOpacity, backgroundOpacity, extraDarkMode]);

  return (
    <div className="flex flex-col h-full bg-background border-l border-r border-b border-border rounded-b-lg shadow-lg relative">
      {/* Background image with opacity - separate from content */}
      {validatedCustomChatBackground !== 'none' && (
        <>
          <div
            className="absolute inset-0 rounded-b-lg"
            style={{
              backgroundImage: `url(${validatedCustomChatBackground})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              opacity: validatedBackgroundOpacity,
              zIndex: 0,
              mixBlendMode: (chatBackgroundBlendMode || 'normal') as React.CSSProperties['mixBlendMode'],
            }}
          ></div>
        </>
      )}
      <div className="flex-grow p-2 space-y-2 overflow-y-auto relative z-10">
        {messages.map((msg, idx) => (
          <ChatMessageItem
            key={msg.id || idx}
            message={msg}
            onSuggestionClick={handleSuggestionClick}
            accentColorName={accentColorName}
            obsSources={msg.type === "source-prompt" ? obsData.sources : undefined}
            onAddToContext={handleAddToContext}
            extraDarkMode={extraDarkMode}
            flipSides={flipSides}
            showSuggestions={msg.showSuggestions || false}
            onRegenerate={handleRegenerate}
            userChatBubbleColorName={userChatBubbleColorName}
            modelChatBubbleColorName={modelChatBubbleColorName}
            customChatBackground={validatedCustomChatBackground}
          />
        ))}
        {isLoading && (
          <div className="flex justify-center items-center py-4">
            <LoadingSpinner size={5} />
            <span className="ml-3 text-sm text-muted-foreground animate-pulse">Gemini is thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-border bg-background rounded-b-lg">
        {/* Enhancement 6: Gemini initialization progress indicator */}
        {isGeminiInitializing && (
          <div className="flex items-center justify-center mb-2">
            <LoadingSpinner size={4} />
            <span className="ml-2 text-sm text-muted-foreground animate-pulse">Initializing Gemini...</span>
          </div>
        )}
        <div className="flex items-center space-x-2 relative">
          {/* Visual indicator if context is present */}
          {hasContext && (
            <div className="absolute left-0 -top-7 flex items-center space-x-1 z-20">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 shadow-sm animate-pulse">
                <svg className="w-3 h-3 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" /></svg>
                Context Active
              </span>
            </div>
          )}
          {/* Custom input with integrated web search toggle */}
          <div className="relative flex-grow">
            {/* StreamerBot actions dropdown or suggestions can go here if needed */}
            {streamerBotActions.length > 0 && (
              <div className="absolute right-0 top-0 z-20 flex flex-col items-end space-y-1 pr-2 pt-1">
                <div className="text-xs text-muted-foreground mb-1">Streamer.bot Actions:</div>
                {streamerBotActions.slice(0, 3).map((action) => (
                  <button
                    key={action.id}
                    className="px-2 py-1 rounded-lg bg-[rgba(80,90,255,0.10)] text-indigo-400 border border-indigo-300 text-xs mb-1 hover:bg-indigo-200/30 hover:text-indigo-600 transition-colors duration-150 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                    onClick={() => handleSuggestionClick(`Trigger Streamer.bot action: ${action.name}`)}
                    style={{
                      background: 'var(--background-color, rgba(80,90,255,0.10))',
                      color: 'var(--accent-color, #6366f1)',
                      borderColor: 'var(--outline-color, #6366f1, #a5b4fc)',
                    }}
                  >
                    <span role="img" aria-label="StreamerBot Action" className="mr-1">🎯</span>{action.name}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center">
              <input
                ref={chatInputRef}
                id="gemini-input"
                type="text"
                value={chatInputValue}
                onChange={(e) => onChatInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isLoading && isGeminiClientInitialized && chatInputValue.trim()) {
                    handleSend();
                  }
                }}
                className="w-full px-3 py-2 rounded-lg bg-[rgba(30,30,40,0.85)] border border-border text-[var(--text-color)] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent transition-colors duration-150 shadow-sm"
                placeholder={isLoading ? 'Waiting for Gemini...' : 'Type your message...'}
                disabled={isLoading || !isGeminiClientInitialized}
                autoComplete="off"
                spellCheck={true}
                style={{
                  background: 'var(--background-color, rgba(30,30,40,0.85))',
                  color: 'var(--text-color, #fff)',
                  borderColor: 'var(--outline-color, #444)',
                }}
              />
              <Button
                type="button"
                variant="primary"
                size="sm"
                accentColorName={accentColorName}
                onClick={handleSend}
                disabled={isLoading || !chatInputValue.trim()}
                className="ml-2 flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-1">
                    <LoadingSpinner size={3} />
                    <span>Sending</span>
                  </div>
                ) : (
                  <>
                    <span role="img" aria-label="Send" className="mr-1">🚀</span>Send
                  </>
                )}
              </Button>
            </div>
          </div>
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10 flex items-center space-x-1">
            <Tooltip content={useGoogleSearch ? "Web search enabled" : "Click to enable web search"}>
              <button
                onClick={() => setUseGoogleSearch(!useGoogleSearch)}
                disabled={!isGeminiClientInitialized}
                className={`p-1 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary/50 ${useGoogleSearch
                  ? 'text-primary bg-primary/10 hover:bg-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  } ${!isGeminiClientInitialized ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                aria-label={useGoogleSearch ? "Disable web search" : "Enable web search"}
              >
                <GlobeAltIcon className="w-4 h-4" />
              </button>
            </Tooltip>
            <Tooltip content={isConnected && currentProgramScene ? "Take screenshot of current scene" : "Connect to OBS to take screenshots"}>
              <button
                onClick={async () => {
                  if (!isConnected || !currentProgramScene) {
                    onAddMessage({ role: 'system', text: "📸 Need to be connected to OBS with an active scene to take screenshots!" });
                    return;
                  }
                  try {
                    const screenshot = await actions.handleObsAction({
                      type: 'getSourceScreenshot',
                      sourceName: currentProgramScene,
                      imageFormat: 'png'
                    });
                    if (screenshot.success) {
                      onAddMessage({ role: 'system', text: screenshot.message });
                      // Also add the screenshot info to context for AI analysis
                      handleAddToContext(`Screenshot of current scene \"${currentProgramScene}\" has been captured and is available for analysis.`);
                    } else {
                      onAddMessage({ role: 'system', text: `📸 Screenshot failed: ${screenshot.error}` });
                    }
                  } catch (error: any) {
                    onAddMessage({ role: 'system', text: `📸 Screenshot error: ${error.message}` });
                  }
                }}
                disabled={!isGeminiClientInitialized || !isConnected || !currentProgramScene}
                className={`p-1 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-orange-500/50 ${isConnected && currentProgramScene
                  ? 'text-orange-500 hover:text-orange-600 hover:bg-orange-500/10'
                  : 'text-muted-foreground cursor-not-allowed opacity-50'
                  }`}
                aria-label="Take screenshot of current scene"
              >
                <CameraIcon className="w-4 h-4" />
              </button>
            </Tooltip>
          </div>
          {/* The correct input and Button JSX is now above. This duplicate/broken block is removed. */}
          {/* Removed status text per user request */}
        </div>
      </div>
    </div>
  );
}
