import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ChatMessageItem } from './ChatMessageItem';
import { LoadingSpinner } from '@/shared/components/common/LoadingSpinner';
import { ChatMessage, CatppuccinAccentColorName } from '@/shared/types';
import type { ChatBackgroundType, ChatPattern } from '@/shared/types/chatBackground';
import { generatePatternCSS } from '@/shared/lib/backgroundPatterns';

interface MessageListProps {
    messages: ChatMessage[];
    isLoading: boolean;
    handleSuggestionClick: (prompt: string) => void;
    obsSources: any[] | undefined;
    handleAddToContext: (text: string) => void;
    extraDarkMode: boolean;
    flipSides: boolean;
    handleRegenerate: (messageId: string) => void;
    userChatBubbleColorName: CatppuccinAccentColorName;
    modelChatBubbleColorName: CatppuccinAccentColorName;
    chatBackgroundType?: ChatBackgroundType;
    chatPattern?: ChatPattern;
    customChatBackground: string;
}

export const MessageList: React.FC<MessageListProps> = ({
    messages,
    isLoading,
    handleSuggestionClick,
    obsSources,
    handleAddToContext,
    return (
        <div
            ref={containerRef}
            className={clsx(
                "flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-3 transition-all duration-300 rounded-2xl bg-background/70 backdrop-blur-md shadow-inner border border-border",
                backgroundClass,
                patternClass,
                extraDarkMode && "bg-black/80"
            )}
            style={backgroundStyle}
        >
            {messages.length === 0 && !isLoading ? (
                <div className="flex flex-1 items-center justify-center text-muted-foreground/70 select-none text-base">
                    No messages yet.
                </div>
            ) : (
                <AnimatePresence initial={false}>
                    {messages.map((msg, idx) => (
                        <ChatMessageItem
                            key={msg.id || idx}
                            message={msg}
                            accentColorName={accentColorName}
                            userChatBubbleColorName={userChatBubbleColorName}
                            modelChatBubbleColorName={modelChatBubbleColorName}
                            flipSides={flipSides}
                        />
                    ))}
                </AnimatePresence>
            )}
            {isLoading && (
                <div className="flex items-center gap-2 text-muted-foreground/70 mt-2">
                    <Loader2 className="animate-spin w-4 h-4" />
                    <span>Thinking...</span>
                </div>
            )}
        </div>
    );
                        backgroundSize: 'cover',
                        backgroundAttachment: 'fixed',
                        backgroundPosition: 'center'
                      }
                    : {}
            }
        >
            {messages.map((msg, idx) => (
                <div key={msg.id || idx} ref={(el) => (messageRefs.current[idx] = el)}>
                    <ChatMessageItem
                        message={msg}
                        onSuggestionClick={handleSuggestionClick}
                        obsSources={msg.type === "source-prompt" ? obsSources : undefined}
                        onAddToContext={handleAddToContext}
                        extraDarkMode={extraDarkMode}
                        flipSides={flipSides}
                        showSuggestions={msg.showSuggestions || false}
                        onRegenerate={handleRegenerate}
                        userChatBubbleColorName={userChatBubbleColorName}
                        modelChatBubbleColorName={modelChatBubbleColorName}
                        customChatBackground={customChatBackground}
                    />
                </div>
            ))}
            {isLoading && (
                <div className="flex justify-center items-center py-4">
                    <LoadingSpinner size={5} />
                    <span className="ml-3 text-sm text-muted-foreground animate-pulse">Gemini is thinking...</span>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>
    );
};
