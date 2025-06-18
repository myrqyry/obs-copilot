import React, { useState, useCallback, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import { ChevronDownIcon, ChevronUpIcon, ClipboardDocumentIcon, ArrowPathIcon, ChatBubbleLeftEllipsisIcon, GlobeAltIcon, CameraIcon } from '@heroicons/react/24/solid';
import { gsap } from 'gsap';
import { GoogleGenAI } from '@google/genai';
import { Button } from './common/Button';
import { TextInput } from './common/TextInput';
import { LoadingSpinner } from './common/LoadingSpinner';
// Removed useObsActions import - now using store directly
import { GEMINI_MODEL_NAME, INITIAL_SYSTEM_PROMPT } from '../constants';
import { getRandomSuggestions } from '../constants/chatSuggestions';
import { highlightJsonSyntax, applyInlineMarkdown } from '../utils/markdown';
import {
  ChatMessage,
  CatppuccinAccentColorName,
  AppTab,
  OBSSource
} from '../types';
import type {
  GeminiActionResponse
} from '../types/obsActions';
import { OBSWebSocketService } from '../services/obsService';
import { useAppStore } from '../store/appStore';
import { useLockStore } from '../store/lockStore';
import { logoAnimations } from '../utils/gsapAnimations';
import { uiAnimations } from '../utils/gsapAnimations'; // Add this import

interface GeminiChatProps {
  geminiApiKeyFromInput?: string;
  obsService: OBSWebSocketService;
  flipSides: boolean;
  setFlipSides: (value: boolean) => void;
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
  onStreamerBotAction: (action: { type: string, args?: Record<string, any> }) => Promise<void>;
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
              <div className="text-xs text-muted-foreground mb-1 font-mono">
                {part.language || 'code'}
              </div>
              <pre className="bg-muted p-2.5 text-xs overflow-x-auto text-muted-foreground border border-border shadow-inner rounded-md leading-tight font-mono">
                <code
                  className="text-foreground font-mono leading-tight"
                  dangerouslySetInnerHTML={{
                    __html: part.language === 'json' ? highlightJsonSyntax(part.content) : part.content
                  }}
                />
              </pre>
            </div>
          ) : (
            <div
              className="text-foreground text-sm leading-tight font-sans"
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
  onAddToContext?: (text: string) => void;
  onRegenerate?: (messageId: string) => void;
  extraDarkMode?: boolean;
}> = ({ message, onSuggestionClick, accentColorName: _, obsSources, onSourceSelect, flipSides, showSuggestions = false, onAddToContext, onRegenerate, extraDarkMode = false }) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const [isShrunk, setIsShrunk] = useState(false);
  const [forceExpand, setForceExpand] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isScrolledFromTop, setIsScrolledFromTop] = useState(false);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
  // const [isHovered, setIsHovered] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);

  // Memoize suggestions to prevent them from changing on every render
  const memoizedSuggestions = useMemo(() => getRandomSuggestions(4), [message.id]);

  // Copy text to clipboard
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      // You could add a toast notification here if desired
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };
  // Add message to context
  const handleAddToContextLocal = () => {
    if (onAddToContext) {
      const contextText = `Previous ${message.role}: ${message.text}`;
      onAddToContext(contextText);
    }
  };

  useLayoutEffect(() => {
    if (itemRef.current) {
      gsap.fromTo(
        itemRef.current,
        { opacity: 0, y: 15, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'power2.out' }
      );
      // Shrink logic: if height > 320px + tolerance (360px), shrink (unless forceExpand)
      // This avoids unnecessary expand buttons for messages just slightly over the limit
      const heightLimit = 320;
      const tolerance = 40; // 40px tolerance to avoid expand button for slightly oversized content
      if (!forceExpand && itemRef.current.scrollHeight > heightLimit + tolerance) {
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
  const isAssistant = message.role === 'model';

  const handleRegenerate = () => {
    if (onRegenerate && message.id) {
      onRegenerate(message.id);
    }
  };

  // System messages are always centered
  const containerClasses = isSystem ? 'justify-center' : flipSides
    ? (isUser ? 'justify-start' : 'justify-end')
    : (isUser ? 'justify-end' : 'justify-start');

  return (
    <div ref={itemRef} className={`flex ${containerClasses} mb-3 font-sans ${isSystem ? 'px-4' : isUser ? 'pl-4' : 'pr-4'}`}>
      <div
        className={`chat-message rounded-2xl shadow-xl border border-border bg-card relative font-sans group
          ${isSystem
            ? 'px-3 py-2 text-sm leading-tight max-w-xl'
            : 'p-3 text-sm leading-tight max-w-lg'}
        `}
        // onMouseEnter={() => setIsHovered(true)}
        // onMouseLeave={() => setIsHovered(false)}
        style={{
          backgroundColor: extraDarkMode
            ? 'transparent'
            : isSystem ? 'var(--dynamic-secondary-accent)' :
              (isUser ? 'var(--user-chat-bubble-color)' : 'var(--model-chat-bubble-color)'),
          borderColor: extraDarkMode
            ? isSystem ? 'var(--dynamic-secondary-accent)' :
              (isUser ? 'var(--user-chat-bubble-color)' : 'var(--model-chat-bubble-color)')
            : undefined,
          borderWidth: extraDarkMode ? '2px' : undefined,
          color: extraDarkMode
            ? isSystem ? 'var(--dynamic-secondary-accent)' :
              (isUser ? 'var(--user-chat-bubble-color)' : 'var(--model-chat-bubble-color)')
            : '#1e1e2e !important',
          fontStyle: isSystem ? 'italic' : 'normal',
          fontSize: '0.875rem',
          position: 'relative',
          ['--bubble-scrollbar-thumb' as any]: isUser
            ? 'var(--user-chat-bubble-color)'
            : message.role === 'model'
              ? 'var(--model-chat-bubble-color)'
              : 'var(--dynamic-secondary-accent)',
          ['--bubble-scrollbar-thumb-hover' as any]: isUser
            ? 'hsl(var(--primary))'
            : message.role === 'model'
              ? 'hsl(var(--secondary))'
              : 'var(--dynamic-secondary-accent)',
          ['--bubble-fade-color' as any]: isUser
            ? 'var(--user-chat-bubble-color)'
            : message.role === 'model'
              ? 'var(--model-chat-bubble-color)'
              : 'var(--dynamic-secondary-accent)'
        }}
      >
        <div
          style={{
            position: 'relative',
            color: extraDarkMode
              ? isSystem ? 'var(--dynamic-secondary-accent) !important' :
                (isUser ? 'var(--user-chat-bubble-color) !important' : 'var(--model-chat-bubble-color) !important')
              : undefined
          }}
          className={extraDarkMode ? '[&_*]:!text-inherit' : '!text-ctp-base [&_*]:!text-ctp-base'}
        >
          <div
            ref={bubbleRef}
            className={`chat-scrollable-content
              ${isShrunk ? 'max-h-80 overflow-y-auto custom-scrollbar shrunk' : ''}
              ${isScrolling ? 'scrolling' : ''}
            `}
            onScroll={isShrunk ? handleBubbleScroll : undefined}
          >
            {message.type === "source-prompt" && obsSources && onSourceSelect ? (
              <div className="source-selection-container">
                <div className="source-selection-header mb-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm emoji">🎯</span>
                    <div className="text-sm font-medium font-sans leading-tight">
                      Choose a source
                    </div>
                  </div>
                  <div className="text-sm opacity-80 font-normal font-sans">
                    {message.sourcePrompt || message.text}
                  </div>
                </div>
                <div className="source-selection-grid grid grid-cols-2 gap-2">
                  {obsSources.map((source) => (
                    <button
                      key={source.sourceName}
                      onClick={() => onSourceSelect(source.sourceName)}
                      className="source-select-btn group flex items-center px-3 py-1.5 bg-background/80 text-foreground border border-border rounded transition-all duration-200 hover:bg-primary hover:text-primary-foreground hover:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                      tabIndex={0}
                      aria-label={`Select source ${source.sourceName}`}
                      data-tooltip={source.typeName || source.inputKind || 'Source'}
                    >
                      <span className="text-sm mr-2 group-hover:scale-105 transition-transform duration-200 flex-shrink-0 emoji">
                        {source.inputKind === 'text_gdiplus_v2' || source.inputKind === 'text_ft2_source_v2' ? '📝' :
                          source.inputKind === 'image_source' ? '🖼️' :
                            source.inputKind === 'browser_source' ? '🌐' :
                              source.inputKind === 'window_capture' ? '🪟' :
                                source.inputKind === 'monitor_capture' ? '🖥️' :
                                  source.inputKind === 'game_capture' ? '🎮' :
                                    source.inputKind === 'dshow_input' ? '📹' :
                                      source.inputKind === 'wasapi_input_capture' || source.inputKind === 'wasapi_output_capture' ? '🎵' :
                                        '🎯'}
                      </span>
                      <div className="flex-1 text-left min-w-0">
                        <div className="font-medium text-sm group-hover:text-background transition-colors duration-200 overflow-hidden text-ellipsis whitespace-nowrap">
                          {source.sourceName}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="relative">
                <MarkdownRenderer content={message.text} />

                {/* Show suggestion buttons for greeting system messages */}
                {showSuggestions && isSystem && onSuggestionClick && (
                  <div className="mt-3 pt-3 border-t border-yellow-500 border-opacity-30">
                    <div className="text-sm opacity-90 mb-3 font-normal font-sans"><span className="emoji">✨</span> Try these commands:</div>
                    <div className="grid grid-cols-2 gap-2">
                      {memoizedSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.id}
                          onClick={() => onSuggestionClick(suggestion.prompt)}
                          className="text-xs px-2 py-1.5 bg-background/80 hover:bg-primary hover:text-primary-foreground rounded border border-border hover:border-primary transition-all duration-200 text-left group shadow-sm"
                          style={{ color: '#f1f5f9 !important' }}
                        >
                          <span className="mr-1.5 text-sm group-hover:scale-110 transition-transform duration-200 inline-block emoji">{suggestion.emoji}</span>
                          <span className="font-normal">{suggestion.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {message.sources && message.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="text-sm opacity-90 mb-2 font-normal font-sans"><span className="emoji">📚</span> Sources:</div>
                    <div className="space-y-1">
                      {message.sources.map((source, idx) => (
                        <div key={idx} className="text-xs">                            <a
                          href={source.web?.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80 hover:underline transition-colors duration-200"
                        >
                          <span className="emoji">🔗</span> {source.web?.title || source.web?.uri}
                        </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Show choice buttons for model messages with choices */}
                {message.type === "choice-prompt" && message.choices && onSuggestionClick && (
                  <div className="mt-3 pt-3 border-t border-primary border-opacity-30">
                    <div className="text-sm opacity-90 mb-3 font-normal font-sans">
                      <span className="emoji">
                        {message.choiceType === 'scene' ? '🎬' :
                          message.choiceType === 'source' ? '🎯' :
                            message.choiceType === 'camera-source' ? '📹' :
                              message.choiceType === 'audio-source' ? '🎵' :
                                message.choiceType === 'text-source' ? '📝' :
                                  message.choiceType === 'screen-source' ? '🖥️' :
                                    message.choiceType === 'source-filter' ? '🎨' :
                                      '🤔'}
                      </span>{' '}
                      {message.choiceType === 'scene' ? 'Select a scene:' :
                        message.choiceType === 'source' ? 'Select a source:' :
                          message.choiceType === 'camera-source' ? 'Select a camera:' :
                            message.choiceType === 'audio-source' ? 'Select an audio source:' :
                              message.choiceType === 'text-source' ? 'Select a text source:' :
                                message.choiceType === 'screen-source' ? 'Select a screen capture:' :
                                  message.choiceType === 'source-filter' ? 'Select a source for filters:' :
                                    'Choose an option:'}
                    </div>
                    <div className={`grid gap-2 ${message.choices.length > 4 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      {message.choices.map((choice, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            if (onAddToContext) {
                              const contextText = `Previous assistant: ${message.text}`;
                              onAddToContext(contextText);
                            }
                            if (onSuggestionClick) {
                              onSuggestionClick(choice);
                            }
                          }}
                          className="text-sm px-3 py-2 bg-background/80 hover:bg-primary hover:text-primary-foreground rounded border border-border hover:border-primary transition-all duration-200 text-left group shadow-sm"
                          style={{ color: '#f1f5f9 !important' }}
                        >
                          <span className="mr-2 text-sm font-medium text-primary group-hover:text-primary-foreground">
                            {String.fromCharCode(65 + idx)})
                          </span>
                          <span className="font-normal">{choice}</span>
                        </button>
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
        <div
          className="text-xs mt-1.5 relative z-20 tracking-wider"
          style={{
            fontFamily: 'Reddit Sans, -apple-system, BlinkMacSystemFont, sans-serif',
            fontWeight: 500,
            color: extraDarkMode
              ? isSystem ? 'var(--dynamic-secondary-accent)' :
                (isUser ? 'var(--user-chat-bubble-color)' : 'var(--model-chat-bubble-color)')
              : '#1e293b', // text-slate-800 equivalent
            fontStyle: 'normal' as React.CSSProperties['fontStyle'] // Prevent inheriting italics
          }}
        >
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>

        {/* Hover action buttons (top right, visible on hover) */}
        <div className="absolute top-2 right-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1">
          {/* Regenerate button (only for assistant messages) */}
          {isAssistant && onRegenerate && (
            <button
              onClick={handleRegenerate}
              className="bg-card/90 backdrop-blur-sm text-muted-foreground hover:text-green-500 hover:bg-green-500/10 p-1 rounded-full shadow-md border border-border transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-green-500/50"
              title="Regenerate response"
              aria-label="Regenerate message"
            >
              <ArrowPathIcon className="w-3 h-3" />
            </button>
          )}

          <button
            onClick={handleCopyText}
            className="bg-card/90 backdrop-blur-sm text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 p-1 rounded-full shadow-md border border-border transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            title="Copy text"
            aria-label="Copy message text"
          >
            <ClipboardDocumentIcon className="w-3 h-3" />
          </button>

          {onAddToContext && (
            <button
              onClick={handleAddToContextLocal}
              className="bg-card/90 backdrop-blur-sm text-muted-foreground hover:text-purple-500 hover:bg-purple-500/10 p-1 rounded-full shadow-md border border-border transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              title="Add to context"
              aria-label="Add message to context"
            >
              <ChatBubbleLeftEllipsisIcon className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Expand/collapse floating icon button (bottom right, more visible) */}
        {isShrunk && !forceExpand && (
          <button
            className="absolute right-3 bottom-3 z-40 bg-card/90 backdrop-blur-sm text-primary hover:text-primary/80 hover:bg-primary/10 p-2 rounded-full shadow-xl border border-border transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary/50"
            onClick={() => setForceExpand(true)}
            title="Expand bubble"
            aria-label="Expand chat bubble"
          >
            <ChevronDownIcon className="w-5 h-5" />
          </button>
        )}
        {forceExpand && (
          <button
            className="absolute right-3 bottom-3 z-40 bg-card/90 backdrop-blur-sm text-muted-foreground hover:text-primary hover:bg-primary/10 p-2 rounded-full shadow-xl border border-border transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary/50"
            onClick={() => setForceExpand(false)}
            title="Shrink bubble"
            aria-label="Shrink chat bubble"
          >
            <ChevronUpIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

// Helper function to detect general choice questions and OBS-specific choices
function detectChoiceQuestion(text: string, obsData?: any): { hasChoices: boolean; choices: string[]; cleanText: string; choiceType?: string } {
  // First, try OBS-specific choice detection if obsData is available
  if (obsData) {
    const obsChoices = detectObsChoiceQuestion(text, obsData);
    if (obsChoices.hasChoices) {
      return obsChoices;
    }
  }

  // General choice question patterns - only trigger on very specific formats
  const choicePatterns = [
    // Question followed by numbered/lettered options with explicit line breaks
    /(?:which|what|choose|select).+?(?:\?|\:)\s*\n(?:(?:\d+[\.\)]\s*|[a-z][\.\)]\s*|\-\s*|\*\s*).+?\n){2,}/gi,
    // Explicit bullet points or dashes with multiple options
    /(?:choose|select|pick).+?(?:\?|\:)\s*\n(?:(?:[\-\*\•]\s*).+?\n){2,}/gi
  ];

  for (const pattern of choicePatterns) {
    const match = text.match(pattern);
    if (match) {
      const matchedText = match[0];
      const choices = extractChoicesFromText(matchedText);
      if (choices.length >= 2 && choices.length <= 10) {
        // Clean up the text by removing the choice indicators
        const cleanText = text.replace(pattern, (matched) => {
          return matched.replace(/(?:\d+[\.\)]\s*|[a-z][\.\)]\s*|\-\s*|\*\s*)/gi, '').trim();
        });
        return { hasChoices: true, choices, cleanText, choiceType: 'general' };
      }
    }
  }

  // Only detect "A or B" patterns in very specific contexts (questions or explicit choices)
  // Must have clear question indicators and be in a choice-making context
  const questionIndicators = /(?:which|what|choose|select|pick|would you like|do you want|prefer)/i;
  if (questionIndicators.test(text)) {
    const orPattern = /\b(\w+(?:\s+\w+){0,2})\s+or\s+(\w+(?:\s+\w+){0,2})\b/gi;
    const orMatches = Array.from(text.matchAll(orPattern));
    if (orMatches.length === 1 && orMatches[0]) { // Only single "or" choice, not multiple
      const match = orMatches[0];
      const choice1 = match[1].trim();
      const choice2 = match[2].trim();

      // Additional validation: choices should be reasonable length and not common words
      const commonWords = ['with', 'your', 'the', 'and', 'can', 'will', 'you', 'me', 'we', 'they', 'help', 'today'];
      if (choice1.length > 2 && choice2.length > 2 &&
        choice1.length < 30 && choice2.length < 30 &&
        !commonWords.includes(choice1.toLowerCase()) &&
        !commonWords.includes(choice2.toLowerCase())) {
        return { hasChoices: true, choices: [choice1, choice2], cleanText: text, choiceType: 'simple-or' };
      }
    }
  }

  return { hasChoices: false, choices: [], cleanText: text };
}

// Helper function to extract choices from text with various formats
function extractChoicesFromText(text: string): string[] {
  const choices: string[] = [];

  // Split by lines and extract choices
  const lines = text.split(/\n|\r\n?/);
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Remove numbering, lettering, bullets, and dashes
    const cleanLine = trimmedLine
      .replace(/^\d+[\.\)]\s*/, '')  // 1. or 1)
      .replace(/^[a-z][\.\)]\s*/i, '') // a. or a) or A.
      .replace(/^[\-\*\•]\s*/, '')    // - or * or •
      .trim();

    if (cleanLine && cleanLine.length > 1) {
      choices.push(cleanLine);
    }
  }

  // If no line-based choices found, try splitting by "or"
  if (choices.length === 0) {
    const orSplit = text.split(/\s+or\s+/i);
    if (orSplit.length >= 2) {
      orSplit.forEach(choice => {
        const cleaned = choice.trim().replace(/^[\-\*\•]\s*/, '');
        if (cleaned && cleaned.length > 1) {
          choices.push(cleaned);
        }
      });
    }
  }

  return choices.filter(choice => choice.length > 1 && choice.length < 100); // Reasonable length limits
}

// Helper function to detect OBS-specific choice questions and generate relevant options
function detectObsChoiceQuestion(text: string, obsData: any): { hasChoices: boolean; choices: string[]; cleanText: string; choiceType?: string } {
  const lowercaseText = text.toLowerCase();

  // Only trigger on very specific ambiguous response patterns
  const ambiguousPatterns = [
    /which\s+(scene|source|filter|camera|audio)\s+(?:do you want|would you like|should i)/i,
    /be\s+more\s+specific\s+about/i,
    /need\s+to\s+specify\s+which/i,
    /which\s+one\s+do\s+you\s+mean/i,
    /clarify\s+which\s+(scene|source|filter)/i,
    /multiple\s+(scenes|sources|filters|cameras)\s+(?:found|available)/i,
    /there\s+are\s+several\s+(scenes|sources)/i,
    /i\s+found\s+multiple/i,
    /could\s+you\s+specify\s+which/i
  ];

  const isAmbiguous = ambiguousPatterns.some(pattern => pattern.test(text));

  // Only proceed if there's a clear ambiguous pattern or very specific command structure
  if (!isAmbiguous) {
    // Check for explicit choice questions only
    const explicitChoicePatterns = [
      /which\s+(scene|source)\s+(?:would you like|do you want)/i,
      /select\s+(?:a\s+)?(scene|source|filter)/i,
      /choose\s+(?:a\s+)?(scene|source|filter)/i
    ];

    const hasExplicitChoice = explicitChoicePatterns.some(pattern => pattern.test(text));
    if (!hasExplicitChoice) {
      return { hasChoices: false, choices: [], cleanText: text };
    }
  }

  // Scene-related choices - only for explicit scene selection
  if ((isAmbiguous && lowercaseText.includes('scene')) ||
    lowercaseText.includes('which scene') || lowercaseText.includes('select scene') ||
    lowercaseText.includes('choose scene')) {
    const scenes = obsData.scenes?.map((scene: any) => scene.sceneName)
      .filter((name: string) => name !== obsData.currentProgramScene) || [];
    if (scenes.length > 1) {
      return { hasChoices: true, choices: scenes.slice(0, 6), cleanText: text, choiceType: 'scene' };
    }
  }

  // Source choices - only for explicit source selection (not status updates)
  if ((isAmbiguous && lowercaseText.includes('source')) ||
    lowercaseText.includes('which source') || lowercaseText.includes('select source') ||
    lowercaseText.includes('choose source')) {
    const sources = obsData.sources?.map((source: any) => source.sourceName) || [];
    if (sources.length > 1) {
      return { hasChoices: true, choices: sources.slice(0, 8), cleanText: text, choiceType: 'source' };
    }
  }

  // Camera source choices - only when explicitly asking about cameras
  if ((isAmbiguous && lowercaseText.includes('camera')) ||
    lowercaseText.includes('which camera') || lowercaseText.includes('select camera')) {
    const cameraSources = obsData.sources?.filter((source: any) =>
      source.inputKind === 'dshow_input' ||
      source.sourceName.toLowerCase().includes('camera') ||
      source.sourceName.toLowerCase().includes('webcam') ||
      source.sourceName.toLowerCase().includes('cam')
    ).map((source: any) => source.sourceName) || [];

    if (cameraSources.length > 1) {
      return { hasChoices: true, choices: cameraSources, cleanText: text, choiceType: 'camera-source' };
    }
  }

  // Text source choices - only when explicitly asking for text source selection
  if ((isAmbiguous && lowercaseText.includes('text source')) ||
    lowercaseText.includes('which text source') || lowercaseText.includes('select text source') ||
    lowercaseText.includes('choose text source')) {
    const textSources = obsData.sources?.filter((source: any) =>
      source.inputKind === 'text_gdiplus_v2' || source.inputKind === 'text_ft2_source_v2' ||
      source.sourceName.toLowerCase().includes('text')
    ).map((source: any) => source.sourceName) || [];

    if (textSources.length > 1) {
      return { hasChoices: true, choices: textSources, cleanText: text, choiceType: 'text-source' };
    }
  }

  // Audio source choices - only when explicitly asking about audio
  if ((isAmbiguous && lowercaseText.includes('audio')) ||
    lowercaseText.includes('which audio') || lowercaseText.includes('select audio') ||
    lowercaseText.includes('which microphone') || lowercaseText.includes('which mic')) {
    const audioSources = obsData.sources?.filter((source: any) =>
      source.inputKind?.includes('audio') ||
      source.inputKind?.includes('wasapi') ||
      source.inputKind?.includes('dshow') ||
      source.sourceName.toLowerCase().includes('audio') ||
      source.sourceName.toLowerCase().includes('mic')
    ).map((source: any) => source.sourceName) || [];

    if (audioSources.length > 1) {
      return { hasChoices: true, choices: audioSources, cleanText: text, choiceType: 'audio-source' };
    }
  }

  // Screen/display capture choices - only when explicitly asking
  if ((isAmbiguous && lowercaseText.includes('screen')) ||
    lowercaseText.includes('which screen') || lowercaseText.includes('select screen') ||
    lowercaseText.includes('which display') || lowercaseText.includes('which monitor')) {
    const screenSources = obsData.sources?.filter((source: any) =>
      source.inputKind === 'monitor_capture' ||
      source.inputKind === 'window_capture' ||
      source.sourceName.toLowerCase().includes('screen') ||
      source.sourceName.toLowerCase().includes('display') ||
      source.sourceName.toLowerCase().includes('monitor')
    ).map((source: any) => source.sourceName) || [];

    if (screenSources.length > 1) {
      return { hasChoices: true, choices: screenSources, cleanText: text, choiceType: 'screen-source' };
    }
  }

  return { hasChoices: false, choices: [], cleanText: text };
}

// This function can be removed or properly implemented later
// function parseUserIntent(userMessage: string) {
//   // Add intent classification before defaulting to OBS actions
//   const obsKeywords = ['source', 'filter', 'scene', 'transition', 'open', 'hide'];
//   const hasObsIntent = obsKeywords.some(keyword =>
//     userMessage.toLowerCase().includes(keyword)
//   );

//   if (!hasObsIntent) {
//     return 'general_conversation';
//   }

//   // Continue with existing OBS command parsing...
// }

export const GeminiChat: React.FC<GeminiChatProps> = ({
  geminiApiKeyFromInput,
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
  onStreamerBotAction,
}) => {
  // Use Zustand for OBS data and actions
  const { scenes, currentProgramScene, sources, streamStatus, recordStatus, videoSettings, autoApplySuggestions, extraDarkMode, actions, isConnected } = useAppStore();
  const obsData = { scenes, currentProgramScene, sources, streamStatus, recordStatus, videoSettings };
  const { isLocked } = useLockStore();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [useGoogleSearch, setUseGoogleSearch] = useState<boolean>(false);
  const [contextMessages, setContextMessages] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ai = useRef<GoogleGenAI | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const sendButtonRef = useRef<HTMLButtonElement>(null);

  // Handle adding messages to context
  const handleAddToContext = useCallback((text: string) => {
    setContextMessages(prev => [...prev, text].slice(-5)); // Keep last 5 context messages
  }, []);

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
      const baseSystemPrompt = `${INITIAL_SYSTEM_PROMPT}\n\n${buildObsSystemMessage()}\n\n${buildStreamerBotSystemMessage()}`;
      const systemPrompt = useGoogleSearch
        ? `${baseSystemPrompt}\n\nYou can also use Google Search to find current information when needed. When you need to search for something, include it in your response. You can provide both OBS actions AND web search results in the same response when appropriate.`
        : baseSystemPrompt;

      // Add context if available
      const contextPrompt = contextMessages.length > 0
        ? `\n\nContext from previous messages:\n${contextMessages.join('\n')}\n\n`
        : '';

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
            // Map action types to lock keys
            const actionType = parsed.obsAction.type;
            const lockMap: Record<string, string> = {
              startStream: 'streamRecord',
              stopStream: 'streamRecord',
              toggleStream: 'streamRecord',
              startRecord: 'streamRecord',
              stopRecord: 'streamRecord',
              toggleRecord: 'streamRecord',
              setVideoSettings: 'videoSettings',
            };
            const lockKey = lockMap[actionType];
            if (lockKey && isLocked(lockKey)) {
              onAddMessage({ role: 'system', text: "Looks like you've locked this setting, so I won't change it for you. If you want me to help with this, just unlock it in the settings!" });
            } else {
              obsActionResult = await actions.handleObsAction(parsed.obsAction);
              await onRefreshData();
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

      // Add OBS action result after Gemini response (ensures proper message order)
      if (obsActionResult) {
        onAddMessage({ role: 'system', text: obsActionResult.message });
        if (!obsActionResult.success) {
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
      const baseSystemPrompt = `${INITIAL_SYSTEM_PROMPT}\n\n${buildObsSystemMessage()}`;
      const systemPrompt = useGoogleSearch
        ? `${baseSystemPrompt}\n\nYou can also use Google Search to find current information when needed. When you need to search for something, include it in your response. You can provide both OBS actions AND web search results in the same response when appropriate.`
        : baseSystemPrompt;

      // Add context if available
      const contextPrompt = contextMessages.length > 0
        ? `\n\nContext from previous messages:\n${contextMessages.join('\n')}\n\n`
        : '';

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
            if (parsed.obsAction) {
              obsActionResult = await actions.handleObsAction(parsed.obsAction);
              await onRefreshData();
            }
            // Prefer responseText for display if present
            if (typeof parsed.responseText === 'string') {
              modelResponseText = parsed.responseText;
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

    let handledSourcePrompt = false;
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
      handledSourcePrompt = true;
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

  useEffect(() => {
    const btn = sendButtonRef.current;
    if (!btn) return;
    const onEnter = () => uiAnimations.buttonHover(btn);
    btn.addEventListener('mouseenter', onEnter);
    return () => btn.removeEventListener('mouseenter', onEnter);
  }, []);

  const { customChatBackground } = useAppStore();

  return (
    <div
      className="flex flex-col h-full bg-background border-l border-r border-b border-border rounded-b-lg shadow-lg"
      style={{
        backgroundImage: customChatBackground ? `url(${customChatBackground})` : undefined,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="flex-grow p-2 space-y-2 overflow-y-auto">
        {messages.map((msg, idx) => (
          <LocalChatMessageItem
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
            onSourceSelect={
              msg.type === "source-prompt"
                ? (srcName) => {
                  let specificPrompt = "";
                  if (msg.sourcePrompt === "Hide a source in the current scene.") {
                    specificPrompt = `Hide the source named '${srcName}' in the current scene`;
                  } else if (msg.sourcePrompt === "Show a source in the current scene.") {
                    specificPrompt = `Show the source named '${srcName}' in the current scene`;
                  } else if (msg.sourcePrompt === "Set the text of a source in the current scene.") {
                    specificPrompt = `I want to change the text content of the source '${srcName}'. What should the new text say and what style should it have?`;
                  } else if (msg.sourcePrompt === "Add a color correction filter to a source.") {
                    specificPrompt = `I want to add a color correction filter to the source '${srcName}'. What type of color adjustment should I apply?`;
                  } else if (msg.sourcePrompt === "Get a PNG screenshot of a source in the current scene.") {
                    specificPrompt = `I want to take a screenshot of the source '${srcName}'. What resolution or size should it be?`;
                  } else if (msg.sourcePrompt === "Open the filters dialog for a source.") {
                    specificPrompt = `Open the filters dialog for the source '${srcName}'`;
                  }

                  // Add the current request to context automatically
                  handleAddToContext(`User wants to: ${msg.sourcePrompt} Selected source: ${srcName}`);

                  onChatInputChange(specificPrompt);
                  document.getElementById('gemini-input')?.focus();
                }
                : undefined
            }
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
        <div className="flex items-center space-x-2">
          {/* Custom input with integrated web search toggle */}
          <div className="relative flex-grow">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10 flex items-center space-x-1">
              <button
                onClick={() => setUseGoogleSearch(!useGoogleSearch)}
                disabled={!isGeminiClientInitialized}
                className={`p-1 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary/50 ${useGoogleSearch
                  ? 'text-primary bg-primary/10 hover:bg-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  } ${!isGeminiClientInitialized ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                title={useGoogleSearch ? "Web search enabled" : "Click to enable web search"}
                aria-label={useGoogleSearch ? "Disable web search" : "Enable web search"}
              >
                <GlobeAltIcon className="w-4 h-4" />
              </button>
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
                      handleAddToContext(`Screenshot of current scene "${currentProgramScene}" has been captured and is available for analysis.`);
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
                title={isConnected && currentProgramScene ? "Take screenshot of current scene" : "Connect to OBS to take screenshots"}
                aria-label="Take screenshot of current scene"
              >
                <CameraIcon className="w-4 h-4" />
              </button>
            </div>
            <input
              id="gemini-input"
              type="text"
              value={chatInputValue}
              onChange={(e) => onChatInputChange(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && isGeminiClientInitialized && handleSend()}
              placeholder={!isGeminiClientInitialized ? (geminiInitializationError || "Gemini not ready...") : "Ask Gemini or command OBS..."}
              className="w-full pl-16 pr-4 py-2 text-sm bg-background border border-border rounded-md 
                         focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50
                         disabled:opacity-50 disabled:cursor-not-allowed
                         placeholder:text-muted-foreground"
              disabled={isLoading || !isGeminiClientInitialized}
              autoComplete="off"
            />
          </div>
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
        {/* Removed status text per user request */}
      </div>
    </div>
  );
};
