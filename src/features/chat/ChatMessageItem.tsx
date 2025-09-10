import React, { useState, useRef, useLayoutEffect, useCallback, useMemo } from 'react';
import {
    catppuccinChatBubbleColorsHexMap,
    catppuccinMochaColors,
    catppuccinSecondaryAccentColorsHexMap,
    ChatMessage,
    CatppuccinAccentColorName,
    OBSSource,
    CatppuccinChatBubbleColorName
} from '@/types';
import { ChevronDown, ChevronUp, Clipboard, RefreshCw, MessageCircle } from 'lucide-react';
import { gsap } from 'gsap';
import { getRandomSuggestions } from '@/constants/chatSuggestions';
import useSettingsStore from '@/store/settingsStore';
import Tooltip from '@/components/ui/Tooltip';
import { SecureHtmlRenderer } from '@/components/ui/SecureHtmlRenderer';

// Import AI Elements components
import {
    Message,
    MessageContent,
} from '@/components/ai-elements';
import { CodeBlock } from '@/components/ai-elements/code-block';
import { Suggestions, Suggestion } from '@/components/ai-elements/suggestion'; // Import Suggestions and Suggestion
import { Sources, SourcesTrigger, SourcesContent, Source } from '@/components/ai-elements/source'; // Import Source components

interface ChatMessageItemProps {
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

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
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
    
    const bubbleRef = useRef<HTMLDivElement>(null);
    // Track previous shrink state to avoid setting state unnecessarily (prevents nested updates)
    const prevShrunkRef = useRef<boolean | null>(null);

    // Get styling from store using individual selectors to prevent infinite re-renders
    const accentColorName = useSettingsStore(state => state.theme.accent);
    const secondaryAccentColorName = useSettingsStore(state => state.theme.secondaryAccent);
    // Use the passed-in bubble color names for user/model
    // theme is no longer needed

    // Remove excessive debugging logs to prevent unnecessary updates
    // Comment out or remove the console logs
    // console.log('Theme:', theme);
    // console.log('User Chat Bubble Color:', theme.userChatBubble);
    // console.log('Model Chat Bubble Color:', theme.modelChatBubble);

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

    // At the top of your component, initialize a ref to hold the timeout ID
    const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useLayoutEffect(() => {
        if (!itemRef.current) return;
        const el = itemRef.current;
        const animation = gsap.fromTo(
            el,
            { opacity: 0, y: 15, scale: 0.98 },
            { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'power2.out' }
        );

        // Shrink logic: if height > 320px + tolerance (360px), shrink (unless forceExpand)
        // Only update state if the computed shrink value differs from previous to avoid nested updates
        const heightLimit = 320;
        const tolerance = 40; // 40px tolerance to avoid expand button for slightly oversized content
        const shouldShrink = !forceExpand && el.scrollHeight > heightLimit + tolerance;

        if (prevShrunkRef.current !== shouldShrink) {
            prevShrunkRef.current = shouldShrink;
            setIsShrunk(shouldShrink);
        }

        return () => {
            animation.kill();
        };
    }, [message, forceExpand]);

    // Debounced scroll handler (single implementation)
    const handleBubbleScroll = (_event: React.UIEvent<HTMLDivElement>) => {
        setIsScrolling(true);

        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }
        scrollTimeoutRef.current = setTimeout(() => setIsScrolling(false), 1000);
    };

    // Add subtle hover animation to the bubble for polish (uses GSAP)
    useLayoutEffect(() => {
        const el = bubbleRef.current;
        if (!el) return;

        // Removed hover animation for a cleaner look
        return () => {
            try { gsap.killTweensOf(el); } catch (e) {}
        };
    }, []);

    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';
    const isAssistant = message.role === 'model';

    const handleRegenerateMemo = useCallback(() => {
        if (onRegenerate && message.id) {
            onRegenerate(message.id);
        }
    }, [onRegenerate, message.id]);

    // Use AI Elements Message and MessageContent for better structure
    const messageRole = isUser ? 'user' : 'assistant';

    // Render content with AI Elements Response component and enhanced code blocks
    const renderContent = () => {
        if (message.status) {
            const { type, message: statusMessage } = message.status;
            let icon = 'ℹ️';
            let colorClass = 'text-blue-400';
            if (type === 'success') {
                icon = '✅';
                colorClass = 'text-green-400';
            } else if (type === 'error') {
                icon = '❌';
                colorClass = 'text-red-400';
            } else if (type === 'warning') {
                icon = '⚠️';
                colorClass = 'text-yellow-400';
            }

            return (
                <div className={`flex items-center gap-2 ${colorClass}`}>
                    <span className="text-lg">{icon}</span>
                    <span>{statusMessage}</span>
                </div>
            );
        }

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
                            allowedAttrs={{
                                '*': ['class'],
                                'a': ['href', 'target', 'rel'],
                                'img': ['src', 'alt']
                            }}
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
                        allowedAttrs={{
                            '*': ['class'],
                            'a': ['href', 'target', 'rel'],
                            'img': ['src', 'alt']
                        }}
                    />
                );
            }
        }

    return parts.length > 0 ? parts : <span className="break-words whitespace-normal">{message.text}</span>;
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
                                            <span className="text-destructive">Error: {val.result.error || 'Failed'}</span>
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

    const containerClasses = isSystem ? 'justify-center' : flipSides
        ? (isUser ? 'justify-start' : 'justify-end')
        : (isUser ? 'justify-end' : 'justify-start');

    // Get color mappings from store and types
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

    // Apply color logic based on mode
    let backgroundColor: string;
    let borderColor: string;
    let textColor: string;

    if (extraDarkMode) {
        // Extra dark mode: dark fill, chosen color for text and border
        backgroundColor = `rgba(${parseInt(catppuccinMochaColors.base.substring(1, 3), 16)}, ${parseInt(catppuccinMochaColors.base.substring(3, 5), 16)}, ${parseInt(catppuccinMochaColors.base.substring(5, 7), 16)}, 0.5)`;
        borderColor = bubbleColorHex;
        textColor = bubbleColorHex;
    } else {
        // Regular mode: chosen color fill, dark text and border
        backgroundColor = `rgba(${parseInt(bubbleColorHex.substring(1, 3), 16)}, ${parseInt(bubbleColorHex.substring(3, 5), 16)}, ${parseInt(bubbleColorHex.substring(5, 7), 16)}, 0.5)`;
        borderColor = catppuccinMochaColors.base;
        textColor = catppuccinMochaColors.base;
    }

    // Apply glass effect classes if needed
    const glassEffectClass = customChatBackground && customChatBackground !== 'none' && 0.5 < 1
        ? extraDarkMode
            ? 'chat-bubble-glass-extra-dark'
            : 'chat-bubble-glass'
        : '';

    // Use CSS variables for bubble theming so styles can be tuned in CSS
    const bubbleStyle: React.CSSProperties = {
        // CSS variables consumed by global CSS
        ['--bubble-bg' as any]: backgroundColor,
        ['--bubble-border' as any]: borderColor,
        ['--bubble-text' as any]: textColor,
        ['--bubble-radius' as any]: '0.75rem',
        ['--bubble-border-width' as any]: isSystem ? '1px' : '1.5px',
        ['--bubble-shadow' as any]: 'none',
        // preserve a few inline fallbacks for environments that don't read CSS variables
        // (visuals primarily driven by the CSS variables above)
        fontStyle: isSystem ? 'italic' : 'normal',
        fontSize: '0.875rem',
        position: 'relative',
        overflow: 'hidden',
        padding: '0.75rem 1rem',
        maxWidth: isSystem ? '400px' : '480px',
        margin: '0.25rem 0',
        transition: 'background 0.28s, border-color 0.28s, box-shadow 0.28s, transform 0.18s',
        mixBlendMode: ('normal') as React.CSSProperties['mixBlendMode'],
    };

    return (
        <div ref={itemRef} className={`flex ${containerClasses} mb-3 font-sans ${isSystem ? 'px-6' : isUser ? 'pl-4' : 'pr-4'}`}>
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
                    style={bubbleStyle}
                >
                    <div className="relative">
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
                                            <div className={`${isSystem ? 'italic' : ''} break-words whitespace-normal`}>
                                                {renderContent()}
                                                {renderDataParts()}
                                            </div>

                                            {/* Show suggestion buttons for greeting system messages */}
                                            {showSuggestions && isSystem && onSuggestionClick && (
                                                <div className="mt-3 pt-3 border-t border-opacity-30">
                                                    <div className="text-sm opacity-90 mb-3 font-normal font-sans"><span className="emoji">✨</span> Try these commands:</div>
                                                    <Suggestions className="grid grid-cols-2 gap-2">
                                                        {memoizedSuggestions.map((suggestion: any) => (
                                                            <Suggestion
                                                                key={suggestion.id}
                                                                suggestion={suggestion.prompt}
                                                                onClick={onSuggestionClick}
                                                                className="text-xs px-2 py-1.5 bg-muted/50 hover:bg-primary/20 text-foreground hover:text-primary-foreground rounded border border-border hover:border-primary transition-all duration-200 text-left group shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                                            >
                                                                <span className="mr-1.5 text-sm group-hover:scale-110 transition-transform duration-200 inline-block emoji">{suggestion.emoji}</span>
                                                                <span className="font-normal">{suggestion.label}</span>
                                                            </Suggestion>
                                                        ))}
                                                    </Suggestions>
                                                </div>
                                            )}

                                            {message.sources && message.sources.length > 0 && (
                                                <Sources className="mt-3 pt-3 border-t border-border">
                                                    <SourcesTrigger count={message.sources.length}>
                                                        <div className="text-sm opacity-90 mb-2 font-normal font-sans"><span className="emoji">📚</span> Sources:</div>
                                                    </SourcesTrigger>
                                                    <SourcesContent className="space-y-1">
                                                        {message.sources.map((source, idx) => (
                                                            <Source
                                                                key={idx}
                                                                href={source.web?.uri}
                                                                title={source.web?.title || source.web?.uri}
                                                                className="text-xs"
                                                            >
                                                                <span className="emoji">🔗</span> {source.web?.title || source.web?.uri}
                                                            </Source>
                                                        ))}
                                                    </SourcesContent>
                                                </Sources>
                                            )}

                                            {/* Show choice buttons for model messages with choices */}
                                            {message.type === "choice-prompt" && message.choices && onSuggestionClick && (
                                                <div className="mt-3 pt-3 border-t border-opacity-30">
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
                    </div>
                    <div
                        className="text-xs mt-1.5 relative z-20 tracking-wider flex items-center gap-2"
                    >
                        {/* placeholder for timestamp text if present */}
                    </div>

                    <div className={`absolute ${isUser ? 'left-2' : 'right-2'} -bottom-6 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 ${isUser ? 'translate-x-[-10px]' : 'translate-x-[10px]'} group-hover:translate-x-0`}>
                        <Tooltip content="Copy text">
                            <button
                                onClick={handleCopyText}
                                className="text-muted-foreground hover:text-info hover:bg-info/10 p-1 rounded-full transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-info/50"
                                aria-label="Copy message text"
                            >
                                <Clipboard className="w-3 h-3" />
                            </button>
                        </Tooltip>

                        {isAssistant && onRegenerate && (
                            <Tooltip content="Regenerate response">
                                <button
                                    onClick={handleRegenerateMemo}
                                    className="text-muted-foreground hover:text-green-500 hover:bg-green-500/10 p-1 rounded-full transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-green-500/50"
                                    aria-label="Regenerate message"
                                >
                                    <RefreshCw className="w-3 h-3" />
                                </button>
                            </Tooltip>
                        )}

                        {onAddToContext && (
                            <Tooltip content="Add to context">
                                <button
                                    onClick={handleAddToContextLocal}
                                    className="text-accent hover:bg-accent/20 p-1 rounded-full transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-accent/50"
                                    aria-label="Add message to context"
                                >
                                    <MessageCircle className="w-4 h-4 text-accent" />
                                </button>
                            </Tooltip>
                        )}
                    </div>

                    {isShrunk && (
                        <div
                            className={`absolute ${isUser ? 'right-2' : 'left-2'} -bottom-6 opacity-0 group-hover:opacity-100 transition-all duration-200 ${isUser ? 'translate-x-[10px]' : 'translate-x-[-10px]'} group-hover:translate-x-0 bg-background/80 text-primary hover:text-primary/80 hover:bg-primary/10 p-2 rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary/50`}
                            onClick={() => setForceExpand(true)}
                            aria-label="Expand chat bubble"
                        >
                            <ChevronDown className="w-5 h-5" />
                        </div>
                    )}
                    {forceExpand && (
                        <Tooltip content="Shrink bubble">
                            <button
                                className={`absolute ${isUser ? 'right-2' : 'left-2'} -bottom-6 opacity-0 group-hover:opacity-100 transition-all duration-200 ${isUser ? 'translate-x-[10px]' : 'translate-x-[-10px]'} group-hover:translate-x-0 bg-background/80 text-muted-foreground hover:text-primary hover:bg-primary/10 p-2 rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary/50`}
                                onClick={() => setForceExpand(false)}
                                aria-label="Shrink chat bubble"
                            >
                                <ChevronUp className="w-5 h-5" />
                            </button>
                        </Tooltip>
                    )}
                </div>
            </Message>
        </div>
    );
};

export default ChatMessageItem;
