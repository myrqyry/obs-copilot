import React, { useState, useRef, useLayoutEffect, useMemo } from 'react';
import { catppuccinChatBubbleColorsHexMap } from '../../types';
import { ChevronDownIcon, ChevronUpIcon, ClipboardDocumentIcon, ArrowPathIcon, ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/solid';
import { gsap } from 'gsap';
import { MarkdownRenderer } from './MarkdownRenderer';
import { getRandomSuggestions } from '../../constants/chatSuggestions';
import { ChatMessage, CatppuccinAccentColorName, OBSSource, CatppuccinChatBubbleColorName } from '../../types';
import { useAppStore } from '../../store/appStore';

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
}


// Solid color backgrounds with opacity for both modes
function solidBg(opacity: number = 0.85) {
    // Use the actual secondary color HSL values: hsl(214, 13%, 14%)
    return `hsla(214, 13%, 14%, ${opacity})`;
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
}) => {
    const itemRef = useRef<HTMLDivElement>(null);
    const [isShrunk, setIsShrunk] = useState(false);
    const [forceExpand, setForceExpand] = useState(false);
    const [isScrolling, setIsScrolling] = useState(false);
    const [isScrolledFromTop, setIsScrolledFromTop] = useState(false);
    const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
    const bubbleRef = useRef<HTMLDivElement>(null);

    // Get styling from store using individual selectors to prevent infinite re-renders
    const bubbleFillOpacity = useAppStore(state => state.bubbleFillOpacity);
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

    // Ensure bubbleFillOpacity and backgroundOpacity are applied correctly
    // Helper to convert hex to rgba
    function hexToRgba(hex: string, alpha: number) {
        let c = hex.replace('#', '');
        if (c.length === 3) {
            c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
        }
        const r = parseInt(c.substring(0, 2), 16);
        const g = parseInt(c.substring(2, 4), 16);
        const b = parseInt(c.substring(4, 6), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    }

    const userColor = catppuccinChatBubbleColorsHexMap[userChatBubbleColorName as keyof typeof catppuccinChatBubbleColorsHexMap];
    const modelColor = catppuccinChatBubbleColorsHexMap[modelChatBubbleColorName as keyof typeof catppuccinChatBubbleColorsHexMap];

    const bubbleStyle: React.CSSProperties = {
        backgroundColor: extraDarkMode
            ? 'transparent'
            : isSystem
                ? `rgba(var(--dynamic-secondary-accent-rgb), ${bubbleFillOpacity})`
                : (isUser
                    ? hexToRgba(userColor, bubbleFillOpacity)
                    : hexToRgba(modelColor, bubbleFillOpacity)),
        borderColor: extraDarkMode
            ? isSystem
                ? 'var(--dynamic-secondary-accent)'
                : (isUser
                    ? userColor
                    : modelColor)
            : 'transparent',
        borderWidth: extraDarkMode ? '2px' : '1px',
        borderStyle: 'solid',
        fontStyle: isSystem ? 'italic' : 'normal',
        fontSize: '0.875rem',
        position: 'relative' as React.CSSProperties['position'],
        ['--bubble-scrollbar-thumb' as any]: isUser
            ? userColor
            : message.role === 'model'
                ? modelColor
                : 'var(--dynamic-secondary-accent)',
        ['--bubble-scrollbar-thumb-hover' as any]: isUser
            ? userColor
            : message.role === 'model'
                ? modelColor
                : 'var(--dynamic-secondary-accent)',
        ['--bubble-fade-color' as any]: isUser
            ? userColor
            : message.role === 'model'
                ? modelColor
                : 'var(--dynamic-secondary-accent)'
    };

    return (
        <div ref={itemRef} className={`flex ${containerClasses} mb-3 font-sans ${isSystem ? 'px-8' : isUser ? 'pl-4' : 'pr-4'}`}>
            <div
                className={`chat-message rounded-2xl shadow-xl border relative font-sans group
          ${isSystem
                        ? 'px-3 py-2 text-sm leading-tight max-w-md'
                        : 'p-3 text-sm leading-tight max-w-lg'}
        `}
                style={bubbleStyle}
            >
                {/* Dark fill effect for extra dark mode, not for system messages */}
                {extraDarkMode && !isSystem && (
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            zIndex: 0,
                            background: solidBg(bubbleFillOpacity),
                            backdropFilter: 'blur(8px) saturate(1.1)',
                            WebkitBackdropFilter: 'blur(8px) saturate(1.1)',
                            borderRadius: '1rem',
                            boxShadow: `0 4px 12px 0 rgba(0,0,0,0.25), inset 0 1px 0 rgba(var(${isUser ? '--user-chat-bubble-color-rgb' : '--model-chat-bubble-color-rgb'}), 0.20)`,
                            transition: 'background 0.3s, box-shadow 0.3s',
                            pointerEvents: 'none',
                        }}
                    />
                )}
                <div
                    style={{
                        position: 'relative',
                        color: extraDarkMode
                            ? isSystem
                                ? 'var(--dynamic-secondary-accent)'
                                : (isUser
                                    ? userColor
                                    : modelColor)
                            : isSystem
                                ? 'var(--dynamic-secondary-accent)'
                                : (isUser
                                    ? userColor
                                    : modelColor)
                    }}
                    className="[&_*]:text-inherit"
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
                                                <div key={idx} className="text-xs">
                                                    <a
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
                                (isUser ? userColor : modelColor)
                            : isSystem ? 'var(--dynamic-secondary-accent)' :
                                (isUser ? userColor : modelColor),
                        opacity: 0.8,
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

                    <div
                        role="button"
                        onClick={handleCopyText}
                        className="bg-card/90 backdrop-blur-sm text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 p-1 rounded-full shadow-md border border-border transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        title="Copy text"
                        aria-label="Copy message text"
                    >
                        <ClipboardDocumentIcon className="w-3 h-3" />
                    </div>

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
