import React, { useState, useCallback, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import { ChevronDownIcon, ChevronUpIcon, ClipboardDocumentIcon, PlusCircleIcon } from '@heroicons/react/24/solid';
import { gsap } from 'gsap';
import { GoogleGenAI } from '@google/genai';
import { Button } from './common/Button';
import { TextInput } from './common/TextInput';
import { LoadingSpinner } from './common/LoadingSpinner';
// Removed useObsActions import - now using store directly
import { GEMINI_MODEL_NAME, INITIAL_SYSTEM_PROMPT } from '../constants';
import { getRandomSuggestions } from '../constants/chatSuggestions';
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
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-[var(--ctp-crust)] font-bold">$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em class="text-[var(--ctp-mantle)]">$1</em>');
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
              className="text-[var(--ctp-crust)] text-sm leading-tight font-sans"
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
}> = ({ message, onSuggestionClick, accentColorName: _, obsSources, onSourceSelect, flipSides, showSuggestions = false, onAddToContext }) => {
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

  // System messages are always centered
  const containerClasses = isSystem ? 'justify-center' : flipSides
    ? (isUser ? 'justify-start' : 'justify-end')
    : (isUser ? 'justify-end' : 'justify-start');

  return (
    <div ref={itemRef} className={`flex ${containerClasses} mb-3 font-sans ${isSystem ? 'px-4' : isUser ? 'pl-4' : 'pr-4'}`}>
      <div
        className={`chat-message rounded-2xl shadow-xl border border-[var(--ctp-surface2)] bg-[var(--ctp-surface0)] relative font-sans group
          ${isSystem
            ? 'px-3 py-2 text-sm leading-tight max-w-xl'
            : 'p-3 text-sm leading-tight max-w-lg'}
        `}
        // onMouseEnter={() => setIsHovered(true)}
        // onMouseLeave={() => setIsHovered(false)}
        style={{
          backgroundColor: isSystem ? 'var(--dynamic-secondary-accent)' :
            (isUser ? 'var(--user-chat-bubble-color)' : 'var(--model-chat-bubble-color)'),
          color: isSystem ? 'var(--ctp-crust)' : 'var(--ctp-crust)',
          fontStyle: isSystem ? 'italic' : 'normal',
          fontSize: '0.875rem',
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
              <div className="source-selection-container">
                <div className="source-selection-header mb-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm emoji">🎯</span>
                    <div className="text-sm text-[var(--ctp-crust)] font-medium font-sans leading-tight">
                      Choose a source
                    </div>
                  </div>
                  <div className="text-sm text-[var(--ctp-mantle)] font-normal font-sans">
                    {message.sourcePrompt || message.text}
                  </div>
                </div>
                <div className="source-selection-grid grid grid-cols-2 gap-2">
                  {obsSources.map((source) => (
                    <button
                      key={source.sourceName}
                      onClick={() => onSourceSelect(source.sourceName)}
                      className="source-select-btn group flex items-center px-3 py-1.5 bg-[var(--ctp-surface0)] text-[var(--ctp-crust)] border border-[var(--ctp-surface1)] rounded transition-all duration-200 hover:bg-[var(--dynamic-accent)] hover:text-[var(--ctp-crust)] hover:border-[var(--dynamic-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--dynamic-accent)]"
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
                        <div className="font-medium text-sm text-[var(--ctp-crust)] group-hover:text-[var(--ctp-crust)] transition-colors duration-200 overflow-hidden text-ellipsis whitespace-nowrap">
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
                  <div className="mt-3 pt-3 border-t border-[var(--ctp-yellow)] border-opacity-30">
                    <div className="text-sm text-[var(--ctp-crust)] text-opacity-90 mb-3 font-normal font-sans"><span className="emoji">✨</span> Try these commands:</div>
                    <div className="grid grid-cols-2 gap-2">
                      {memoizedSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.id}
                          onClick={() => onSuggestionClick(suggestion.prompt)}
                          className="text-xs px-2 py-1.5 bg-[var(--ctp-surface0)] text-[var(--ctp-crust)] hover:bg-[var(--dynamic-accent)] hover:text-[var(--ctp-crust)] rounded border border-[var(--ctp-surface1)] hover:border-[var(--dynamic-accent)] transition-all duration-200 text-left group"
                        >
                          <span className="mr-1.5 text-sm group-hover:scale-110 transition-transform duration-200 inline-block emoji">{suggestion.emoji}</span>
                          <span className="font-normal">{suggestion.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {message.sources && message.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[var(--ctp-surface2)]">
                    <div className="text-sm text-[var(--ctp-crust)] text-opacity-90 mb-2 font-normal font-sans"><span className="emoji">📚</span> Sources:</div>
                    <div className="space-y-1">
                      {message.sources.map((source, idx) => (
                        <div key={idx} className="text-xs">                            <a
                          href={source.web?.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--ctp-sky)] hover:text-[var(--ctp-sapphire)] hover:underline transition-colors duration-200"
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
                  <div className="mt-3 pt-3 border-t border-[var(--ctp-blue)] border-opacity-30">
                    <div className="text-sm text-[var(--ctp-crust)] text-opacity-90 mb-3 font-normal font-sans">
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
                          className="text-sm px-3 py-2 bg-[var(--ctp-surface0)] text-[var(--ctp-crust)] hover:bg-[var(--dynamic-accent)] hover:text-[var(--ctp-crust)] rounded border border-[var(--ctp-surface1)] hover:border-[var(--dynamic-accent)] transition-all duration-200 text-left group"
                        >
                          <span className="mr-2 text-sm font-medium text-[var(--ctp-blue)] group-hover:text-[var(--ctp-crust)]">
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
        <div className="text-xs mt-1.5 text-[var(--ctp-crust)] text-opacity-90 relative z-20 font-normal">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>

        {/* Hover action buttons (top right, visible on hover) */}
        <div className="absolute top-2 right-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1">
          <button
            onClick={handleCopyText}
            className="bg-gradient-to-br from-[var(--ctp-base)]/90 to-[var(--ctp-surface2)]/90 text-[var(--ctp-text)] hover:text-[var(--dynamic-accent)] p-1.5 rounded-full shadow-lg border border-[var(--ctp-overlay1)] transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[var(--dynamic-accent)]"
            title="Copy text"
            aria-label="Copy message text"
          >
            <ClipboardDocumentIcon className="w-4 h-4" />
          </button>

          {onAddToContext && (
            <button
              onClick={handleAddToContextLocal}
              className="bg-gradient-to-br from-[var(--ctp-base)]/90 to-[var(--ctp-surface2)]/90 text-[var(--ctp-text)] hover:text-[var(--dynamic-accent)] p-1.5 rounded-full shadow-lg border border-[var(--ctp-overlay1)] transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[var(--dynamic-accent)]"
              title="Add to context"
              aria-label="Add message to context"
            >
              <PlusCircleIcon className="w-4 h-4" />
            </button>
          )}
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
}) => {
  // Use Zustand for OBS data and actions
  const { scenes, currentProgramScene, sources, streamStatus, videoSettings, autoApplySuggestions, actions } = useAppStore();
  const obsData = { scenes, currentProgramScene, sources, streamStatus, videoSettings };

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

      // Add context if available
      const contextPrompt = contextMessages.length > 0
        ? `\n\nContext from previous messages:\n${contextMessages.join('\n')}\n\n`
        : '';

      if (useGoogleSearch) {
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

      if (!useGoogleSearch) {
        try {
          // Try to extract a JSON block (```json ... ``` or {...})
          const jsonMatch = modelResponseText.match(/```json\n([\s\S]*?)\n```/) || modelResponseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const jsonStr = jsonMatch[1] || jsonMatch[0];
            const parsed: GeminiActionResponse = JSON.parse(jsonStr);
            if (parsed.obsAction) {
              const result = await actions.handleObsAction(parsed.obsAction);
              if (result.success) {
                onAddMessage({ role: 'system', text: result.message });
              } else {
                onAddMessage({ role: 'system', text: result.message });
                setErrorMessage(`OBS Action failed: ${result.error}`);
              }
              await onRefreshData();
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
      } else {
        // For Google Search responses, clean up any JSON artifacts
        try {
          // Check if the response is pure JSON and try to extract readable content
          const parsed = JSON.parse(modelResponseText);
          if (parsed.responseText || parsed.text || parsed.content) {
            displayText = parsed.responseText || parsed.text || parsed.content;
          } else {
            // If it's structured data, format it nicely
            displayText = modelResponseText; // Keep original if it's already readable
          }
        } catch (err) {
          // Not JSON, use as-is (which is good for Google search responses)
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
    } else {
      // Check autoApplySuggestions setting
      if (autoApplySuggestions) {
        // Auto-apply: send the message immediately
        onChatInputChange(prompt);
        setTimeout(() => {
          if (!isLoading && isGeminiClientInitialized && prompt.trim()) {
            handleSend();
          }
        }, 100); // Small delay to ensure input is updated
      } else {
        // Regular behavior: just fill the input
        onChatInputChange(prompt);
        document.getElementById('gemini-input')?.focus();
      }
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

  return (
    <div className="flex flex-col h-full bg-[var(--ctp-surface0)] rounded-lg shadow-lg border border-[var(--ctp-surface1)]">
      <div
        className="p-3 border-b border-[var(--ctp-surface1)] text-base font-semibold emoji-text bg-[var(--ctp-mantle)] rounded-t-lg font-sans"
        style={{ color: 'var(--dynamic-accent)' }}
      >
        Gemini Assistant
      </div>

      <div className="flex-grow p-2 space-y-2 overflow-y-auto">
        {messages.map((msg, idx) => (
          <LocalChatMessageItem
            key={msg.id || idx}
            message={msg}
            onSuggestionClick={handleSuggestionClick}
            accentColorName={accentColorName}
            obsSources={msg.type === "source-prompt" ? obsData.sources : undefined}
            onAddToContext={handleAddToContext}
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
