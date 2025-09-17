import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChatMessageItem } from './ChatMessageItem';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ChatMessage, CatppuccinAccentColorName } from '@/types';
import type { ChatBackgroundType, ChatPattern } from '@/types/chatBackground';
import { generatePatternCSS } from '@/lib/backgroundPatterns';

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
    extraDarkMode,
    flipSides,
    handleRegenerate,
    chatBackgroundType = 'image',
    chatPattern,
    userChatBubbleColorName,
    modelChatBubbleColorName,
    customChatBackground,
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div
            className={`flex-grow p-2 space-y-2 overflow-y-auto relative z-10 ${
                chatBackgroundType === 'image' ? 'bg-cover bg-fixed bg-center' : ''
            }`}
            style={
                chatBackgroundType === 'image'
                    ? { backgroundImage: `url(${customChatBackground})` }
                    : chatPattern
                    ? {
                        backgroundImage: generatePatternCSS(chatPattern),
                        backgroundSize: 'cover',
                        backgroundAttachment: 'fixed',
                        backgroundPosition: 'center'
                      }
                    : {}
            }
        >
            {messages.map((msg, idx) => (
                <motion.div
                    key={msg.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
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
                </motion.div>
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
