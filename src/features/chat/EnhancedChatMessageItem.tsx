import React, { useState, useRef, useLayoutEffect, useMemo } from 'react';
import {
    catppuccinChatBubbleColorsHexMap,
    catppuccinMochaColors,
    catppuccinSecondaryAccentColorsHexMap,
    ChatMessage,
    CatppuccinAccentColorName,
    OBSSource,
    CatppuccinChatBubbleColorName
} from '@/types';
import { ChevronDownIcon, ChevronUpIcon, ClipboardDocumentIcon, ArrowPathIcon, ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/solid';
import { gsap } from 'gsap';
import { getRandomSuggestions } from '@/constants/chatSuggestions';
import { useSettingsStore } from '@/store/settingsStore';
import Tooltip from '@/components/ui/Tooltip';
import SecureHtmlRenderer from '@/components/ui/SecureHtmlRenderer';

// Import AI Elements components
import {
    Message,
    MessageContent,
} from '@/components/ai-elements';
import { CodeBlock } from '@/components/ai-elements/code-block';

interface EnhancedChatMessageItemProps {
    message: ChatMessage;
    onSuggestionClick?: (prompt: string) => void;
    accentColorName?: CatppuccinAccentColorName;
    obsSources?: OBSSource[];
    onSourceSelect?: (sourceName: string) => void;
    flipSides: boolean;
    extraDarkMode: boolean;
    showSuggestions?: boolean;
    onAddToContext?: (text: string) => void;
    onRegenerate?: (messageId: string) => void;
    userChatBubbleColorName: CatppuccinChatBubbleColorName;
    modelChatBubbleColorName: CatppuccinChatBubbleColorName;
    customChatBackground?: string;
}

export const EnhancedChatMessageItem: React.FC<EnhancedChatMessageItemProps> = ({
    message,
    onSuggestionClick,
    accentColorName: _,
    obsSources,
    onSourceSelect,
    flipSides,
    extraDarkMode,
    showSuggestions = false,
    onAddToContext,
    onRegenerate,
    userChatBubbleColorName,
    modelChatBubbleColorName,
    customChatBackground,
}) => {
    const itemRef = useRef<HTMLDivElement>(null);
    const [isShrunk, setIsShrunk] = useState(false);
    const [forceExpand, setForceExpand] = useState(false);
    const [isScrolling, setIsScrolling] = useState(false);
    const [isScrolledFromTop, setIsScrolledFromTop] = useState(false);
    const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
    const bubbleRef = useRef<HTMLDivElement>(null);

    // Get styling from store using individual selectors to prevent infinite re-renders
    const bubbleFillOpacity = useSettingsStore(state => state.bubbleFillOpacity);
    const chatBubbleBlendMode = useSettingsStore(state => state.chatBubbleBlendMode);
    const accentColorName = useSettingsStore(state => state.theme.accent);
    const secondaryAccentColorName = useSettingsStore(state => state.theme.secondaryAccent);

    // Memoize suggestions to prevent them from changing on every render
    const memoizedSuggestions = useMemo(() => getRandomSuggestions(4), [message.id]);

    // Copy text to clipboard
    const handleCopyText = async () => {
        try {
            await navigator.clipboard.writeText(message.text);
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

    const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useLayoutEffect(() => {
        if (itemRef.current) {
            const animation = gsap.fromTo(
                itemRef.current,
                { opacity: 0, y: 15, scale: 0.98 },
                { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'power2.out' }
            );

            const heightLimit = 320;
            const tolerance = 40;
            if (!forceExpand && itemRef.current.scrollHeight > heightLimit + tolerance) {
                setIsShrunk(true);
            } else {
                setIsShrunk(false);
            }
            return () => {
                animation.kill();
            };
        }
    }, [message, forceExpand]);

    // Debounced scroll handler
    const handleBubbleScroll = (event: React.UIEvent<HTMLDivElement>) => {
        const target = event.currentTarget as HTMLDivElement;
        setIsScrolling(true);
        setIsScrolledFromTop(target.scrollTop > 10);

        const isAtBottom =
            target.scrollHeight - target.scrollTop - target.clientHeight < 5;
        setIsScrolledToBottom(isAtBottom);

        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }
        scrollTimeoutRef.current = setTimeout(() => setIsScrolling(false), 1000);
    };

    // Add subtle hover animation
    useLayoutEffect(() => {
        const el = bubbleRef.current;
        if (!el) return;

        const handleEnter = () => {
            try {
                gsap.to(el, { scale: 1.015, boxShadow: '0 6px 18px rgba(0,0,0,0.12)', duration: 0.25, ease: 'power2.out' });
            } catch (e) {}
        };
        const handleLeave = () => {
            try {
                gsap.to(el, { scale: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', duration: 0.25, ease: 'power2.in' });
            } catch (e) {}
        };

        el.addEventListener('mouseenter', handleEnter);
        el.addEventListener('mouseleave', handleLeave);

        return () => {
            el.removeEventListener('mouseenter', handleEnter);
            el.removeEventListener('mouseleave', handleLeave);
            try { gsap.killTweensOf(el); } catch (e) {}
        };
    }, []);

    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';
    const isAssistant = message.role === 'model';

    const handleRegenerate = () => {
        if (onRegenerate && message.id) {
            onRegenerate(message.id);
        }
    };

    // Get color mappings
    const userColor = catppuccinChatBubbleColorsHexMap[userChatBubbleColorName];
    const modelColor = catppuccinChatBubbleColorsHexMap[modelChatBubbleColorName];
    const accentColor = catppuccinChatBubbleColorsHexMap[accentColorName];
    const secondaryAccentColor = catppuccinSecondaryAccentColorsHexMap[secondaryAccentColorName];

    // Get the appropriate colors for this message type
    let bubbleColorHex: string;
    if (isSystem) {
        bubbleColorHex = secondaryAccentColor;
    } else if (isUser) {
        bubbleColorHex = userColor;
    } else if (isAssistant) {
        bubbleColorHex = modelColor;
    } else {
        bubbleColorHex = accentColor;
    }

    // Dark base color for outlines and dark fills
    const darkColor = catppuccinMochaColors.base;

    // Apply color logic based on mode
    let backgroundColor: string;
    let borderColor: string;
    let textColor: string;

    if (extraDarkMode) {
        backgroundColor = `rgba(${darkColor}, ${bubbleFillOpacity})`;
        borderColor = `rgba(${bubbleColorHex}, 0.8)`;
        textColor = bubbleColorHex;
    } else {
        backgroundColor = `rgba(${bubbleColorHex}, ${bubbleFillOpacity})`;
        borderColor = `rgba(${darkColor}, 0.8)`;
        textColor = darkColor;
    }

    // Apply glass effect classes if needed
    const glassEffectClass = customChatBackground && customChatBackground !== 'none' && bubbleFillOpacity < 1
        ? extraDarkMode
            ? 'chat-bubble-glass-extra-dark'
            : 'chat-bubble-glass'
        : '';

    // Use AI Elements Message and MessageContent for better structure
    const messageRole = isUser ? 'user' : 'assistant';

    // Render content with AI Elements Response component and enhanced code blocks
    const renderContent = () => {
        const parts = [];
        let lastIndex = 0;
        const codeBlockRegex = /```(\w*)\s*\n?([\s\S]*?)\n?\s*```/g;
        let match;

        while ((match = codeBlockRegex.exec(message.text)) !== null) {
            if (match.index > lastIndex) {
                const htmlFragment = message.text.substring(lastIndex, match.index);
                if (htmlFragment.trim()) {
                    parts.push(
                        <SecureHtmlRenderer
                            key={lastIndex}
                            htmlContent={htmlFragment}
                            allowedTags={['p','br','strong','em','code','pre','ul','ol','li','a','span','div']}
                            allowedAttributes={['class','href','target','rel']}
                        />
                    );
                }
            }

            const language = match[1] || 'text';
            const code = match[2];

            parts.push(
                <CodeBlock
                    key={`code-${match.index}`}
                    language={language}
                    code={code}
                    className="my-2"
                />
            );

            lastIndex = codeBlockRegex.lastIndex;
        }

        if (lastIndex < message.text.length) {
            const htmlFragment = message.text.substring(lastIndex);
            if (htmlFragment.trim()) {
                parts.push(
                    <SecureHtmlRenderer
                        key={lastIndex}
                        htmlContent={htmlFragment}
                        allowedTags={['p','br','strong','em','code','pre','ul','ol','li','a','span','div']}
                        allowedAttributes={['class','href','target','rel']}
                    />
                );
            }
        }

        return parts.length > 0 ? parts : <span style={{ color: textColor }}>{message.text}</span>;
    };
 
    // Render AI SDK 5 Data Parts (typed streaming updates)
    const renderDataParts = () => {
        if (!message.dataParts || message.dataParts.length === 0) return null;

        return (
            <div className="mb-2 space-y-2">
                {message.dataParts.map((part, idx) => {
                    const key = part.id || `datapart-${idx}`;
                    if (part.type === 'status') {
                        const val = (part.value as any) || {};
                        return (
                            <div key={key} className="bg-muted/10 p-2 rounded-md border border-border">
                                <div className="flex items-center justify-between text-xs mb-1">
                                    <div className="font-medium text-sm">{val.message || 'Status'}</div>
                                    <div className="text-xs opacity-80">{val.status}</div>
                                </div>
                                {typeof val.progress === 'number' ? (
                                    <div className="w-full bg-background h-2 rounded overflow-hidden">
                                        <div className="h-2 bg-primary" style={{ width: `${Math.min(100, Math.max(0, val.progress))}%` }} />
                                    </div>
                                ) : val.details ? (
                                    <div className="text-xs opacity-80">{val.details}</div>
                                ) : null}
                            </div>
                        );
                    }
 
                    if (part.type === 'obs-action' || part.type === 'streamerbot-action') {
                        const val = (part.value as any) || {};
                        return (
                            <div key={key} className="bg-muted/5 p-2 rounded-md border border-border flex flex-col">
                                <div className="flex items-center gap-2">
                                    <div className="text-sm font-medium">{val.action || part.type}</div>
                                    <div className="text-xs opacity-80">{val.target ? `→ ${val.target}` : null}</div>
                                </div>
                                <div className="text-xs mt-1 opacity-80">Status: {val.status}</div>
                                {val.result && (
                                    <div className="text-xs mt-1">
                                        {val.result.success ? (
                                            <span className="text-green-500">Success: {val.result.message || 'OK'}</span>
                                        ) : (
                                            <span className="text-red-500">Error: {val.result.error || 'Failed'}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    }
 
                    if (part.type === 'media') {
                        const val = (part.value as any) || {};
                        if (val.url) {
                            const isImage = String(val.contentType || '').startsWith('image');
                            return (
                                <div key={key} className="rounded-md overflow-hidden border border-border">
                                    {isImage ? (
                                        // eslint-disable-next-line jsx-a11y/img-redundant-alt
                                        <img src={val.url} alt={val.alt || 'media'} className="w-full object-contain" />
                                    ) : (
                                        <a href={val.url} target="_blank" rel="noreferrer" className="block p-2 text-sm">
                                            {val.caption || val.url}
                                        </a>
                                    )}
                                </div>
                            );
                        }
                    }
 
                    // Fallback: render JSON preview
                    return (
                        <pre key={key} className="text-xs bg-muted/5 p-2 rounded-md overflow-x-auto">
                            {JSON.stringify(part.value)}
                        </pre>
                    );
                })}
            </div>
        );
    };
 
    return (
        <div ref={itemRef} className={`flex ${isSystem ? 'justify-center' : flipSides
            ? (isUser ? 'justify-start' : 'justify-end')
            : (isUser ? 'justify-end' : 'justify-start')} mb-3 font-sans ${isSystem ? 'px-6' : isUser ? 'pl-4' : 'pr-4'}`}>
            <Message
                from={messageRole}
                className="w-full"
            >
            <div
                className={`chat-message rounded-2xl shadow-xl border relative font-sans group ${glassEffectClass}
              ${isSystem
                        ? 'p-3 text-sm leading-tight max-w-lg'
                        : 'p-3 text-sm leading-tight max-w-lg'}
            `}
                style={{
                    backgroundColor,
                    borderColor,
                    borderWidth: extraDarkMode ? '2px' : '1px',
                    borderStyle: 'solid',
                    color: textColor,
                    fontStyle: isSystem ? 'italic' : 'normal',
                    fontSize: '0.875rem',
                    position: 'relative',
                    boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)',
                    borderRadius: '1rem',
                    padding: '0.5rem 1rem',
                    maxWidth: isSystem ? '400px' : '480px',
                    minWidth: '60px',
                    margin: '0.25rem 0',
                    overflow: 'hidden',
                    transition: 'background 0.3s, box-shadow 0.3s, border-color 0.3s',
                    mixBlendMode: (chatBubbleBlendMode || 'normal') as React.CSSProperties['mixBlendMode'],
                }}
            >
                <div
                    style={{
                        position: 'relative',
                        color: textColor
                    }}
                >
                    <div
                        ref={bubbleRef}
                        className={`chat-scrollable-content
                          ${isShrunk ? 'max-h-80 overflow-y-auto custom-scrollbar shrunk' : ''}
                          ${isScrolling ? 'scrolling' : ''}
                        `}
                        onScroll={isShrunk ? handleBubbleScroll : undefined}
                    >
                        <MessageContent className="p-0 bg-transparent border-0">
                            <div className="p-0 bg-transparent">
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
                                                <Tooltip key={source.sourceName} content={source.typeName || source.inputKind || 'Source'}>
                                                    <button
                                                        onClick={() => onSourceSelect(source.sourceName)}
                                                        className="source-select-btn group flex items-center px-3 py-1.5 bg-background/80 text-foreground border border-border rounded transition-all duration-200 hover:bg-primary hover:text-primary-foreground hover:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                                                        tabIndex={0}
                                                        aria-label={`Select source ${source.sourceName}`}
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
                                                </Tooltip>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <div style={{ color: textColor, fontStyle: isSystem ? 'italic' : 'normal', wordBreak: 'break-word', whiteSpace: 'normal' }}>
                                            {renderContent()}
                                            {renderDataParts()}
                                        </div>

                                        {/* Show suggestion buttons for greeting system messages */}
                                        {showSuggestions && isSystem && onSuggestionClick && (
                                            <div className="mt-3 pt-3 border-t border-opacity-30" style={{ borderColor: bubbleColorHex }}>
                                                <div className="text-sm opacity-90 mb-3 font-normal font-sans"><span className="emoji">✨</span> Try these commands:</div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {memoizedSuggestions.map((suggestion) => (
                                                        <button
                                                            key={suggestion.id}
                                                             onClick={() => onSuggestionClick(suggestion.prompt)}                                                     className="text-xs px-2 py-1.5 bg-muted/50 hover:bg-primary/20 text-foreground hover:text-primary-foreground rounded border border-border hover:border-primary transition-all duration-200 text-left group shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                                        >
                                                            <span className="mr-1.5 text-sm group-hover:scale-110 transition-transform duration-200 emoji">{suggestion.emoji}</span>
                                                            <span className="font-normal">{suggestion.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Show choice buttons for model messages with choices */}
                                        {message.type === "choice-prompt" && message.choices && onSuggestionClick && (
                                            <div className="mt-3 pt-3 border-t border-opacity-30" style={{ borderColor: bubbleColorHex }}>
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
                                                            className="text-sm px-3 py-2 bg-background/80 hover:bg-primary hover:text-primary-foreground rounded border border-border hover:border-primary transition-all duration-200 text-left group shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
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
                        </MessageContent>
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
                    className="text-xs mt-1.5 relative z-20 tracking-wider flex items-center gap-2"
                    style={{
                        fontFamily: 'Reddit Sans, -apple-system, BlinkMacSystemFont, sans-serif',
                        fontWeight: 500,
                        color: textColor,
                        opacity: 0.8,
                    }}
                >
                    <div className="flex-1 text-xs">{/* placeholder for timestamp text if present */}</div>

                    <div className="flex items-center gap-1">
                        <Tooltip content="Copy text">
                            <button
                                onClick={handleCopyText}
                                className="bg-card/90 backdrop-blur-sm text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 p-1 rounded-full shadow-md border border-border transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                aria-label="Copy message text"
                            >
                                <ClipboardDocumentIcon className="w-3 h-3" />
                            </button>
                        </Tooltip>

                        {isAssistant && onRegenerate && (
                            <Tooltip content="Regenerate response">
                                <button
                                    onClick={handleRegenerate}
                                    className="bg-card/90 backdrop-blur-sm text-muted-foreground hover:text-green-500 hover:bg-green-500/10 p-1 rounded-full shadow-md border border-border transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-green-500/50"
                                    aria-label="Regenerate message"
                                >
                                    <ArrowPathIcon className="w-3 h-3" />
                                </button>
                            </Tooltip>
                        )}

                        {onAddToContext && (
                            <Tooltip content="Add to context">
                                <button
                                    onClick={handleAddToContextLocal}
                                    className="bg-card/90 backdrop-blur-sm text-accent hover:bg-accent/20 p-1 rounded-full shadow-md border border-border transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-accent/50"
                                    aria-label="Add message to context"
                                >
                                    <ChatBubbleLeftEllipsisIcon className="w-4 h-4 text-accent" />
                                </button>
                            </Tooltip>
                        )}
                    </div>
                </div>

                {/* Expand/collapse floating icon button */}
                {isShrunk && !forceExpand && (
                    <Tooltip content="Expand bubble">
                        <button
                            className="absolute right-3 bottom-3 z-40 bg-card/90 backdrop-blur-sm text-primary hover:text-primary/80 hover:bg-primary/10 p-2 rounded-full shadow-xl border border-border transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary/50"
                            onClick={() => setForceExpand(true)}
                            aria-label="Expand chat bubble"
                        >
                            <ChevronDownIcon className="w-5 h-5" />
                        </button>
                    </Tooltip>
                )}
                {forceExpand && (
                    <Tooltip content="Shrink bubble">
                        <button
                            className="absolute right-3 bottom-3 z-40 bg-card/90 backdrop-blur-sm text-muted-foreground hover:text-primary hover:bg-primary/10 p-2 rounded-full shadow-xl border border-border transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary/50"
                            onClick={() => setForceExpand(false)}
                            aria-label="Shrink chat bubble"
                        >
                            <ChevronUpIcon className="w-5 h-5" />
                        </button>
                    </Tooltip>
                )}
            </div>
            </Message>
        </div>
    );
};

export default EnhancedChatMessageItem;
