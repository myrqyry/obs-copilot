import React, { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';
import { gsap } from 'gsap';
import { GoogleGenAI } from '@google/genai';
import { Button } from './common/Button';
import { TextInput } from './common/TextInput';
import { LoadingSpinner } from './common/LoadingSpinner';
import { useObsActions } from '../hooks/useObsActions';
import { GEMINI_MODEL_NAME, INITIAL_SYSTEM_PROMPT } from '../constants';
import { getRandomSuggestions } from '../constants/chatSuggestions';
import {
  ChatMessage,
  OBSScene,
  OBSSource,
  OBSStreamStatus,
  OBSVideoSettings,
  CatppuccinAccentColorName,
  AppTab
} from '../types';
import type {
  GeminiActionResponse
} from '../types/obsActions';
import { OBSWebSocketService } from '../services/obsService';

interface GeminiChatProps {
  geminiApiKeyFromInput?: string;
  obsService: OBSWebSocketService;
  flipSides: boolean;
  setFlipSides: (value: boolean) => void;
  obsData: {
    scenes: OBSScene[];
    currentProgramScene: string | null;
    sources: OBSSource[];
    streamStatus: OBSStreamStatus | null;
    videoSettings: OBSVideoSettings | null;
  };
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
  streamerName: string | null;
}

function highlightJsonSyntax(rawJsonString: string): string {
  let htmlEscapedJsonString = rawJsonString
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  htmlEscapedJsonString = htmlEscapedJsonString
    .replace(/"([^"\\]*(\\.[^"\\]*)*)"(\s*:)?/g, (match, _fullString, _stringContent, _escape, colon) => {
      const className = colon ? 'text-[var(--ctp-blue)]' : 'text-[var(--ctp-green)]';
      return `<span class="${className}">${match.substring(0, match.length - (colon ? 1 : 0))}</span>${colon ? ':' : ''}`;
    })
    .replace(/\b(true|false|null)\b/g, '<span class="text-[var(--ctp-mauve)]">$1</span>')
    .replace(/(?<!\w)([-+]?\d*\.?\d+([eE][-+]?\d+)?)(?!\w)/g, '<span class="text-[var(--ctp-peach)]">$1</span>');

  return htmlEscapedJsonString;
}

function applyInlineMarkdown(text: string): string {
  let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  html = html.replace(/`([^`]+)`/g, '<code class="bg-[var(--ctp-surface0)] px-1 py-0.5 rounded text-xs text-[var(--ctp-peach)] shadow-inner">$1</code>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-[var(--ctp-base)] font-bold">$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em class="text-[var(--ctp-mauve)]">$1</em>');
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[var(--ctp-sky)] hover:text-[var(--ctp-sapphire)] underline transition-colors">$1</a>');
  html = html.replace(/\n/g, '<br />');
  return html;
}

const MarkdownRenderer: React.FC<{ content: string }> = React.memo(({ content }) => {
  const processContent = useCallback((text: string) => {
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
    const parts: Array<{ type: 'text' | 'code', content: string, language?: string }> = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
      }
      parts.push({ type: 'code', content: match[2] || '', language: match[1] || 'text' });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.slice(lastIndex) });
    }

    return parts;
  }, []);

  const parts = processContent(content);

  return (
    <div className="markdown-content font-sans">
      {parts.map((part, index) => (
        <div key={index}>
          {part.type === 'code' ? (
            <div className="my-2">
              <div className="text-xs text-[var(--ctp-overlay1)] mb-1 font-mono">
                {part.language || 'code'}
              </div>
              <pre className="bg-[var(--ctp-crust)] p-2.5 text-xs overflow-x-auto text-[var(--ctp-subtext1)] border border-[var(--ctp-surface1)] shadow-inner rounded-md leading-tight font-mono">
                <code
                  className="text-[var(--ctp-text)] font-mono leading-tight"
                  dangerouslySetInnerHTML={{
                    __html: part.language === 'json' ? highlightJsonSyntax(part.content) : part.content
                  }}
                />
              </pre>
            </div>
          ) : (
            <div
              className="text-[var(--ctp-base)] text-sm leading-tight font-sans"
              dangerouslySetInnerHTML={{ __html: applyInlineMarkdown(part.content) }}
            />
          )}
        </div>
      ))}
    </div>
  );
});

const LocalChatMessageItem: React.FC<{
  message: ChatMessage;
  onSuggestionClick?: (prompt: string) => void;
  accentColorName?: CatppuccinAccentColorName;
  obsSources?: OBSSource[];
  onSourceSelect?: (sourceName: string) => void;
  flipSides: boolean;
  showSuggestions?: boolean;
}> = ({ message, onSuggestionClick, accentColorName: _, obsSources, onSourceSelect, flipSides, showSuggestions = false }) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const [isShrunk, setIsShrunk] = useState(false);
  const [forceExpand, setForceExpand] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isScrolledFromTop, setIsScrolledFromTop] = useState(false);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
  const bubbleRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (itemRef.current) {
      gsap.fromTo(
        itemRef.current,
        { opacity: 0, y: 15, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'power2.out' }
      );
      // Shrink logic: if height > 320px, shrink (unless forceExpand)
      if (!forceExpand && itemRef.current.scrollHeight > 320) {
        setIsShrunk(true);
      } else {
        setIsShrunk(false);
      }
    }
  }, [message, forceExpand]);

  const handleBubbleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    setIsScrolling(true);
    setIsScrolledFromTop(target.scrollTop > 10);

    // Check if scrolled to bottom (within 5px tolerance)
    const isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 5;
    setIsScrolledToBottom(isAtBottom);

    clearTimeout((handleBubbleScroll as any)._scrollTimeout);
    (handleBubbleScroll as any)._scrollTimeout = setTimeout(() => setIsScrolling(false), 1000);
  };

  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  // System messages are always centered
  const containerClasses = isSystem ? 'justify-center' : flipSides
    ? (isUser ? 'justify-start' : 'justify-end')
    : (isUser ? 'justify-end' : 'justify-start');

  return (
    <div ref={itemRef} className={`flex ${containerClasses} mb-3 font-sans`}>
      <div
        className={`chat-message max-w-xl rounded-2xl shadow-xl border border-[var(--ctp-surface2)] bg-[var(--ctp-surface0)] relative
          ${isSystem
            ? 'px-4 py-2 text-xs font-extrabold leading-tight'
            : 'p-4 leading-tight'}
        `}
        style={{
          backgroundColor: isSystem ? 'var(--dynamic-secondary-accent)' :
            (isUser ? 'var(--user-chat-bubble-color)' : 'var(--model-chat-bubble-color)'),
          color: 'var(--ctp-base)',
          fontStyle: isSystem ? 'italic' : 'normal',
          fontSize: isSystem ? '0.85rem' : '1rem',
          position: 'relative',
          ['--bubble-scrollbar-thumb' as any]: isUser
            ? 'var(--user-chat-bubble-color)'
            : message.role === 'model'
              ? 'var(--model-chat-bubble-color)'
              : 'var(--dynamic-secondary-accent)',
          ['--bubble-scrollbar-thumb-hover' as any]: isUser
            ? 'var(--ctp-blue)'
            : message.role === 'model'
              ? 'var(--ctp-lavender)'
              : 'var(--dynamic-secondary-accent)',
          ['--bubble-fade-color' as any]: isUser
            ? 'var(--user-chat-bubble-color)'
            : message.role === 'model'
              ? 'var(--model-chat-bubble-color)'
              : 'var(--dynamic-secondary-accent)'
        }}
      >
        <div style={{ position: 'relative' }}>
          <div
            ref={bubbleRef}
            className={`chat-scrollable-content
              ${isShrunk ? 'max-h-80 overflow-y-auto custom-scrollbar shrunk' : ''}
              ${isScrolling ? 'scrolling' : ''}
            `}
            onScroll={isShrunk ? handleBubbleScroll : undefined}
          >
            {message.type === "source-prompt" && obsSources && onSourceSelect ? (
              <div>
                <div className="text-base text-[var(--ctp-base)] mb-3 font-semibold font-sans">{message.text}</div>
                <div className="flex flex-wrap gap-2">
                  {obsSources.map((source) => (
                    <button
                      key={source.sourceName}
                      onClick={() => onSourceSelect(source.sourceName)}
                      className="source-select-btn flex items-center min-w-[140px] px-4 py-2 text-base font-sans font-medium bg-[var(--ctp-surface0)] text-[var(--ctp-base)] border border-[var(--ctp-surface2)] rounded-lg shadow-sm transition-all duration-200 hover:bg-[var(--dynamic-accent)] hover:text-[var(--ctp-base)] hover:border-[var(--dynamic-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--dynamic-accent)] focus:z-10"
                      style={{ letterSpacing: '0.01em', lineHeight: 1.2 }}
                      tabIndex={0}
                      aria-label={`Select source ${source.sourceName}`}
                    >
                      <span className="font-mono text-[var(--ctp-text)] group-hover:text-[var(--ctp-base)] text-base truncate max-w-[8rem]">{source.sourceName}</span>
                      <span className="text-[var(--ctp-subtext0)] ml-2 text-xs">({source.typeName || source.inputKind || 'Source'})</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="relative">
                <MarkdownRenderer content={message.text} />

                {/* Show suggestion buttons for greeting system messages */}
                {showSuggestions && isSystem && onSuggestionClick && (
                  <div className="mt-3 pt-3 border-t border-[var(--ctp-yellow)] border-opacity-30">
                    <div className="text-xs text-[var(--ctp-base)] text-opacity-70 mb-3 font-medium">✨ Try these commands:</div>
                    <div className="grid grid-cols-2 gap-2">
                      {getRandomSuggestions(4).map((suggestion) => (
                        <button
                          key={suggestion.id}
                          onClick={() => onSuggestionClick(suggestion.prompt)}
                          className="text-xs px-3 py-2 bg-[var(--ctp-surface0)] hover:bg-[var(--dynamic-accent)] hover:text-[var(--ctp-base)] rounded-md border border-[var(--ctp-surface2)] hover:border-[var(--dynamic-accent)] transition-all duration-200 text-left group"
                        >
                          <span className="mr-1.5 text-sm group-hover:scale-110 transition-transform duration-200 inline-block">{suggestion.emoji}</span>
                          <span className="font-medium">{suggestion.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {message.sources && message.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[var(--ctp-surface2)]">
                    <div className="text-xs text-[var(--ctp-base)] text-opacity-70 mb-2 font-medium">📚 Sources:</div>
                    <div className="space-y-1">
                      {message.sources.map((source, idx) => (
                        <div key={idx} className="text-xs">
                          <a
                            href={source.web?.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--ctp-sky)] hover:text-[var(--ctp-sapphire)] hover:underline transition-colors duration-200"
                          >
                            🔗 {source.web?.title || source.web?.uri}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Top fade overlay when scrolled from top */}
          {isShrunk && isScrolledFromTop && (
            <div className="bubble-fade-top" />
          )}
          {/* Absolutely positioned fade overlay, only when shrunk and not at bottom */}
          {isShrunk && !isScrolledToBottom && (
            <div className={`bubble-fade-bottom ${isScrolling ? 'opacity-30' : 'opacity-100'}`} />
          )}
        </div>

        {/* Timestamp outside of scrollable area */}
        <div className="text-xs mt-1.5 text-[var(--ctp-base)] text-opacity-70 relative z-20">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>

        {/* Expand/collapse floating icon button (bottom right, more visible) */}
        {isShrunk && !forceExpand && (
          <button
            className="absolute right-3 bottom-3 z-40 bg-gradient-to-br from-[var(--ctp-base)]/90 to-[var(--ctp-surface2)]/90 text-[var(--dynamic-accent)] hover:text-[var(--ctp-mauve)] p-2.5 rounded-full shadow-2xl border-2 border-[var(--ctp-overlay1)] transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[var(--ctp-mauve)]"
            style={{ fontSize: '1.7rem', lineHeight: 1, boxShadow: '0 6px 24px 0 rgba(0,0,0,0.22)' }}
            onClick={() => setForceExpand(true)}
            title="Expand bubble"
            aria-label="Expand chat bubble"
          >
            <ChevronDownIcon className="w-7 h-7" />
          </button>
        )}
        {forceExpand && (
          <button
            className="absolute right-3 bottom-3 z-40 bg-gradient-to-br from-[var(--ctp-base)]/90 to-[var(--ctp-surface2)]/90 text-[var(--ctp-overlay1)] hover:text-[var(--ctp-mauve)] p-2.5 rounded-full shadow-2xl border-2 border-[var(--ctp-overlay1)] transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[var(--ctp-mauve)]"
            style={{ fontSize: '1.7rem', lineHeight: 1, boxShadow: '0 6px 24px 0 rgba(0,0,0,0.22)' }}
            onClick={() => setForceExpand(false)}
            title="Shrink bubble"
            aria-label="Shrink chat bubble"
          >
            <ChevronUpIcon className="w-7 h-7" />
          </button>
        )}
      </div>
    </div>
  );
};

export const GeminiChat: React.FC<GeminiChatProps> = ({
  geminiApiKeyFromInput,
  obsService,
  obsData,
  onRefreshData,
  setErrorMessage,
  chatInputValue,
  onChatInputChange,
  accentColorName,
  messages,
  onAddMessage,
  isGeminiClientInitialized,
  geminiInitializationError,
  onSetIsGeminiClientInitialized,
  onSetGeminiInitializationError,
  streamerName,
  flipSides,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [useGoogleSearch, setUseGoogleSearch] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ai = useRef<GoogleGenAI | null>(null);

  // Use the extracted OBS actions hook
  const { handleObsAction } = useObsActions({
    obsService,
    obsData,
    onRefreshData,
    onAddMessage,
    setErrorMessage
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (geminiApiKeyFromInput) {
      try {
        ai.current = new GoogleGenAI({ apiKey: geminiApiKeyFromInput });
        onSetIsGeminiClientInitialized(true);
        onSetGeminiInitializationError(null);

        if (streamerName && messages.length === 0) {
          const streamer = streamerName ? ` ${streamerName}` : '';
          onAddMessage({
            role: 'system',
            text: `Gemini Assistant connected${streamer}! Ready for your commands! GLHF! ✨`,
            showSuggestions: true
          });
        }
      } catch (error) {
        console.error('Gemini client initialization error:', error);
        const errorMsg = `❗ Failed to initialize Gemini: ${(error as Error).message}`;
        onAddMessage({ role: 'system', text: errorMsg });
        onSetIsGeminiClientInitialized(false);
        onSetGeminiInitializationError(errorMsg);
      }
    } else {
      onSetIsGeminiClientInitialized(false);
      onSetGeminiInitializationError('❗ Missing Gemini API key. Please provide a valid API key to use Gemini features.');
    }
  }, [geminiApiKeyFromInput, onSetIsGeminiClientInitialized, onSetGeminiInitializationError, onAddMessage, streamerName]);

  const buildObsSystemMessage = useCallback(() => {
    const sceneNames = obsData.scenes.map(s => s.sceneName).join(', ');
    const sourceNames = obsData.sources.map(s => s.sourceName).join(', ');
    const currentScene = obsData.currentProgramScene || 'None';
    const streamStatus = obsData.streamStatus ? `Active (${obsData.streamStatus.outputDuration}s)` : 'Inactive';
    const videoRes = obsData.videoSettings ? `${obsData.videoSettings.baseWidth}x${obsData.videoSettings.baseHeight}` : 'Unknown';

    return `
**OBS Context:**
- Current Scene: ${currentScene}
- Available Scenes: ${sceneNames}
- Available Sources: ${sourceNames}
- Stream Status: ${streamStatus}
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

  const handleSend = async () => {
    if (!chatInputValue.trim() || !ai.current || isLoading) return;

    const userMessageText = chatInputValue.trim();
    setIsLoading(true);
    onChatInputChange('');
    onAddMessage({ role: 'user', text: userMessageText });

    try {
      let finalPrompt = userMessageText;
      const systemPrompt = useGoogleSearch
        ? `${INITIAL_SYSTEM_PROMPT}\n\nYou can use Google Search to find current information. When you need to search for something, include it in your response. Focus on providing helpful, accurate, and up-to-date information.`
        : `${INITIAL_SYSTEM_PROMPT}\n\n${buildObsSystemMessage()}`;

      if (useGoogleSearch) {
        finalPrompt = `Please search for information about: ${userMessageText}`;
      }

      const response = await ai.current.models.generateContent({
        model: GEMINI_MODEL_NAME,
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\n${finalPrompt}` }]
          }
        ]
      });

      let modelResponseText = response.text || 'No response received';
      let responseSources: any[] | undefined;

      if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        responseSources = response.candidates[0].groundingMetadata.groundingChunks;
      }

      let displayText = modelResponseText;

      if (!useGoogleSearch) {
        try {
          // Try to extract a JSON block (```json ... ``` or {...})
          const jsonMatch = modelResponseText.match(/```json\n([\s\S]*?)\n```/) || modelResponseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const jsonStr = jsonMatch[1] || jsonMatch[0];
            const parsed: GeminiActionResponse = JSON.parse(jsonStr);
            if (parsed.obsAction) {
              await handleObsAction(parsed.obsAction);
            }
            // Prefer responseText for display if present
            if (typeof parsed.responseText === 'string') {
              displayText = parsed.responseText;
            } else {
              displayText = JSON.stringify(parsed, null, 2);
            }
          }
        } catch (err) {
          // If parsing fails, just show the original text
          console.warn('No valid OBS action found in response:', err);
        }
      }

      onAddMessage({ role: 'model', text: displayText, sources: responseSources });
    } catch (error: any) {
      console.error('Gemini API call failed:', error);
      const errorMessageText = error?.message || 'Unknown error occurred';
      onAddMessage({ role: 'system', text: `❗ Gemini API Error: ${errorMessageText}` });
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
    if (genericSourcePrompts.includes(prompt)) {
      onAddMessage({
        role: "system",
        text: "Select a source for this action:",
        type: "source-prompt",
        sourcePrompt: prompt,
      });
    } else {
      onChatInputChange(prompt);
      document.getElementById('gemini-input')?.focus();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--ctp-surface0)] rounded-lg shadow-lg border border-[var(--ctp-surface1)]">
      <div className="p-3 border-b border-[var(--ctp-surface1)] text-base font-semibold emoji-text bg-[var(--ctp-mantle)] rounded-t-lg font-sans" style={{ color: 'var(--dynamic-accent)' }}>
        <div className="flex items-center space-x-2">
          <span className="emoji text-lg font-emoji">✨</span>
          <span className="font-sans">Gemini Assistant</span>
          {!isGeminiClientInitialized && (
            <span className="text-xs text-[var(--ctp-red)] bg-[var(--ctp-red)] bg-opacity-20 px-2 py-1 rounded-full font-sans">
              Not Ready
            </span>
          )}
          {isGeminiClientInitialized && (
            <span className="text-xs text-[var(--ctp-green)] bg-[var(--ctp-green)] bg-opacity-20 px-2 py-1 rounded-full font-sans">
              Connected
            </span>
          )}
        </div>
      </div>

      <div className="flex-grow p-2 space-y-2 overflow-y-auto">
        {messages.map((msg, idx) => (
          <LocalChatMessageItem
            key={msg.id || idx}
            message={msg}
            onSuggestionClick={handleSuggestionClick}
            accentColorName={accentColorName}
            obsSources={msg.type === "source-prompt" ? obsData.sources : undefined}
            onSourceSelect={
              msg.type === "source-prompt"
                ? (srcName) => {
                  let specificPrompt = "";
                  if (msg.sourcePrompt === "Hide a source in the current scene.") {
                    specificPrompt = `Hide the source named '${srcName}' in the current scene`;
                  } else if (msg.sourcePrompt === "Show a source in the current scene.") {
                    specificPrompt = `Show the source named '${srcName}' in the current scene`;
                  } else if (msg.sourcePrompt === "Set the text of a source in the current scene.") {
                    specificPrompt = `Set the text of source '${srcName}' to 'Your text here'`;
                  } else if (msg.sourcePrompt === "Add a color correction filter to a source.") {
                    specificPrompt = `Add a color correction filter named 'Vibrance' to source '${srcName}' with settings { saturation: 0.2 }`;
                  } else if (msg.sourcePrompt === "Get a PNG screenshot of a source in the current scene.") {
                    specificPrompt = `Get a PNG screenshot of the source '${srcName}' with width 640`;
                  } else if (msg.sourcePrompt === "Open the filters dialog for a source.") {
                    specificPrompt = `Open the filters dialog for the source '${srcName}'`;
                  }
                  onChatInputChange(specificPrompt);
                  document.getElementById('gemini-input')?.focus();
                }
                : undefined
            }
            flipSides={flipSides}
            showSuggestions={msg.showSuggestions || false}
          />
        ))}
        {isLoading && (
          <div className="flex justify-center items-center py-4">
            <LoadingSpinner size={5} />
            <span className="ml-3 text-sm text-[var(--ctp-subtext0)] animate-pulse">Gemini is thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-[var(--ctp-surface1)] bg-[var(--ctp-mantle)] rounded-b-lg">
        <div className="flex items-center space-x-2">
          <TextInput
            id="gemini-input"
            type="text"
            value={chatInputValue}
            onChange={(e) => onChatInputChange(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && isGeminiClientInitialized && handleSend()}
            placeholder={!isGeminiClientInitialized ? (geminiInitializationError || "Gemini not ready...") : "Ask Gemini or command OBS..."}
            className="flex-grow text-sm"
            disabled={isLoading || !isGeminiClientInitialized}
            accentColorName={accentColorName}
            autoComplete="off"
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !chatInputValue.trim() || !isGeminiClientInitialized}
            variant="primary"
            size="sm"
            accentColorName={accentColorName}
          >
            {isLoading ? (
              <div className="flex items-center space-x-1">
                <LoadingSpinner size={3} />
                <span>Sending</span>
              </div>
            ) : (
              '🚀 Send'
            )}
          </Button>
        </div>
        <div className="mt-2">
          <label className="flex items-center space-x-2 text-xs text-[var(--ctp-subtext0)] cursor-pointer group">
            <input
              type="checkbox"
              checked={useGoogleSearch}
              onChange={(e) => setUseGoogleSearch(e.target.checked)}
              className="appearance-none h-4 w-4 border-2 border-[var(--ctp-surface2)] rounded-sm bg-[var(--ctp-surface0)]
                         checked:bg-[var(--dynamic-accent)] checked:border-transparent focus:outline-none 
                         focus:ring-2 focus:ring-offset-0 focus:ring-[var(--dynamic-accent)] focus:ring-opacity-50
                         transition duration-150 group-hover:border-[var(--ctp-overlay1)]"
              disabled={!isGeminiClientInitialized}
            />
            <span className="group-hover:text-[var(--ctp-text)] transition-colors duration-200">
              <span className="mr-1">🌍</span>
              Use Google Search <span className="text-[var(--ctp-subtext1)]">(disables OBS actions)</span>
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};
