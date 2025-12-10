import React, { useState, useRef, useLayoutEffect, useMemo } from 'react';
import {
    catppuccinChatBubbleColorsHexMap,
    catppuccinMochaColors,
    catppuccinSecondaryAccentColorsHexMap,
    ChatMessage,
    OBSSource,
    CatppuccinChatBubbleColorName
} from '@/shared/types';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { gsap } from 'gsap';
import { getRandomSuggestions } from '@/shared/constants/chatSuggestions';
import useConfigStore from '@/app/store/configStore';
import { Tooltip } from "@/shared/components/ui";
import { Message, MessageContent } from '@/shared/components/ai-elements';
import { Sources, SourcesTrigger, SourcesContent, Source } from '@/shared/components/ai-elements/source';

// New component imports
import { MessageContentRenderer } from './components/MessageContentRenderer';
import { DataPartsRenderer } from './components/DataPartsRenderer';
import { SourcePrompt } from './components/SourcePrompt';
import { ChoicePrompt } from './components/ChoicePrompt';
import { MessageSuggestions } from './components/MessageSuggestions';
import { MessageActions } from './components/MessageActions';

interface ChatMessageItemProps {
    message: ChatMessage;
    onSuggestionClick?: (prompt: string) => void;
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
    obsSources,
    onSourceSelect,
    return (
        <div
            className={clsx(
                'flex w-full',
                isUser ? (flipSides ? 'justify-start' : 'justify-end') : (flipSides ? 'justify-end' : 'justify-start')
            )}
        >
            <div
                className={clsx(
                    'max-w-[80%] flex flex-col',
                    isUser
                        ? userChatBubbleColorName
                            ? `bg-${userChatBubbleColorName} text-foreground`
                            : 'bg-accent text-accent-foreground'
                        : modelChatBubbleColorName
                        ? `bg-${modelChatBubbleColorName} text-foreground`
                        : 'bg-card text-card-foreground',
                    'rounded-2xl px-5 py-3 mb-1 shadow-lg',
                    glassClass,
                    isSystem && 'border border-dashed border-border/60',
                    isUser ? 'self-end' : 'self-start',
                    'backdrop-blur-sm bg-opacity-90'
                )}
            >
                <span className="text-xs font-semibold opacity-70 mb-1 select-none tracking-wide">
                    {isSystem ? 'System' : isUser ? 'You' : 'Gemini'}
                </span>
                <div className="whitespace-pre-wrap break-words text-base leading-relaxed">
                    {message.content}
                </div>
            </div>
        </div>
    );
        const tolerance = 40;
        const shouldShrink = !forceExpand && el.scrollHeight > heightLimit + tolerance;

        if (prevShrunkRef.current !== shouldShrink) {
            prevShrunkRef.current = shouldShrink;
            setIsShrunk(shouldShrink);
        }

        return () => {
            animation.kill();
        };
    }, [message, forceExpand]);

    const handleBubbleScroll = (_event: React.UIEvent<HTMLDivElement>) => {
        setIsScrolling(true);
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }
        scrollTimeoutRef.current = setTimeout(() => setIsScrolling(false), 1000);
    };

    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';
    const isAssistant = message.role === 'model';
    const messageRole = isUser ? 'user' : 'assistant';

    const renderStatus = () => {
        if (!message.status) return null;
        const { type, message: statusMessage } = message.status;
        let icon = 'ℹ️';
        let colorClass = 'text-primary';
        if (type === 'success') {
            icon = '✅';
            colorClass = 'text-success';
        } else if (type === 'error') {
            icon = '❌';
            colorClass = 'text-error';
        } else if (type === 'warning') {
            icon = '⚠️';
            colorClass = 'text-warning';
        }

        return (
            <div className={`flex items-center gap-2 ${colorClass}`}>
                <span className="text-lg">{icon}</span>
                <span>{statusMessage}</span>
            </div>
        );
    };

    const containerClasses = isSystem ? 'justify-center' : flipSides
        ? (isUser ? 'justify-start' : 'justify-end')
        : (isUser ? 'justify-end' : 'justify-start');

    const userColor = catppuccinChatBubbleColorsHexMap[userChatBubbleColorName];
    const modelColor = catppuccinChatBubbleColorsHexMap[modelChatBubbleColorName];
    const accentColor = catppuccinChatBubbleColorsHexMap[accentColorName];
    const secondaryAccentColor = catppuccinSecondaryAccentColorsHexMap[secondaryAccentColorName];

    let bubbleColorHex: string;
    if (isSystem) {
        bubbleColorHex = secondaryAccentColor;
    } else if (isUser) {
        bubbleColorHex = userColor;
    } else {
        bubbleColorHex = modelColor;
    }

    let backgroundColor: string;
    let borderColor: string;
    let textColor: string;

    if (extraDarkMode) {
        backgroundColor = `rgba(${parseInt(catppuccinMochaColors.base.substring(1, 3), 16)}, ${parseInt(catppuccinMochaColors.base.substring(3, 5), 16)}, ${parseInt(catppuccinMochaColors.base.substring(5, 7), 16)}, 0.5)`;
        borderColor = bubbleColorHex;
        textColor = bubbleColorHex;
    } else {
        backgroundColor = `rgba(${parseInt(bubbleColorHex.substring(1, 3), 16)}, ${parseInt(bubbleColorHex.substring(3, 5), 16)}, ${parseInt(bubbleColorHex.substring(5, 7), 16)}, 0.5)`;
        borderColor = catppuccinMochaColors.base;
        textColor = catppuccinMochaColors.base;
    }

    const glassEffectClass = customChatBackground && customChatBackground !== 'none' && 0.5 < 1
        ? extraDarkMode
            ? 'chat-bubble-glass-extra-dark'
            : 'chat-bubble-glass'
        : '';

    const bubbleStyle: React.CSSProperties = {
        ['--bubble-bg' as any]: backgroundColor,
        ['--bubble-border' as any]: borderColor,
        ['--bubble-text' as any]: textColor,
        ['--bubble-radius' as any]: '0.75rem',
        ['--bubble-border-width' as any]: isSystem ? '1px' : '1.5px',
        ['--bubble-shadow' as any]: 'none',
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
            <Message from={messageRole} className="w-full">
                <div
                    className={`chat-message rounded-2xl shadow-xl border relative font-sans group ${glassEffectClass} ${isSystem ? 'p-3 text-sm leading-tight max-w-lg' : 'p-3 text-sm leading-tight max-w-lg'}`}
                    style={bubbleStyle}
                >
                    <div className="relative">
                        <div
                            ref={bubbleRef}
                            className={`chat-scrollable-content ${isShrunk ? 'max-h-80 overflow-y-auto custom-scrollbar shrunk' : ''} ${isScrolling ? 'scrolling' : ''}`}
                            onScroll={isShrunk ? handleBubbleScroll : undefined}
                        >
                            <MessageContent className="p-0 bg-transparent border-0">
                                <div className="p-0 bg-transparent">
                                    {message.status ? renderStatus() :
                                     message.type === "source-prompt" && obsSources && onSourceSelect ? (
                                        <SourcePrompt
                                            prompt={message.sourcePrompt || message.text}
                                            sources={obsSources}
                                            onSourceSelect={onSourceSelect}
                                        />
                                    ) : (
                                        <div className="relative">
                                            <div className={`${isSystem ? 'italic' : ''} break-words whitespace-normal`}>
                                                <MessageContentRenderer text={message.text} />
                                                <DataPartsRenderer dataParts={message.dataParts || []} />
                                            </div>

                                            {showSuggestions && isSystem && onSuggestionClick && (
                                                <MessageSuggestions
                                                    suggestions={memoizedSuggestions}
                                                    onSuggestionClick={onSuggestionClick}
                                                />
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

                                            {message.type === "choice-prompt" && message.choices && onSuggestionClick && (
                                                <ChoicePrompt
                                                    message={message}
                                                    onSuggestionClick={onSuggestionClick}
                                                    onAddToContext={onAddToContext}
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                            </MessageContent>
                        </div>
                    </div>
                    <div className="text-xs mt-1.5 relative z-20 tracking-wider flex items-center gap-2" />

                    <MessageActions
                        message={message}
                        isUser={isUser}
                        isAssistant={isAssistant}
                        onRegenerate={onRegenerate}
                        onAddToContext={onAddToContext}
                    />

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
