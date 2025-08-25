import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { EnhancedChatMessageItem } from './EnhancedChatMessageItem';
import { ChatMessage, CatppuccinAccentColorName } from '@/types';
import { Loader } from '@/components/ai-elements';

interface EnhancedMessageListProps {
    messages: ChatMessage[];
    isLoading: boolean;
    handleSuggestionClick: (prompt: string) => void;
    accentColorName?: CatppuccinAccentColorName;
    obsSources: any[] | undefined;
    handleAddToContext: (text: string) => void;
    extraDarkMode: boolean;
    flipSides: boolean;
    handleRegenerate: (messageId: string) => void;
    userChatBubbleColorName: CatppuccinAccentColorName;
    modelChatBubbleColorName: CatppuccinAccentColorName;
    customChatBackground: string;
}

export const EnhancedMessageList: React.FC<EnhancedMessageListProps> = ({
    messages,
    isLoading,
    handleSuggestionClick,
    accentColorName,
    obsSources,
    handleAddToContext,
    extraDarkMode,
    flipSides,
    handleRegenerate,
    userChatBubbleColorName,
    modelChatBubbleColorName,
    customChatBackground,
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="flex-grow p-2 space-y-2 overflow-y-auto relative z-10">
            {messages.map((msg, idx) => (
                <motion.div
                    key={msg.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <EnhancedChatMessageItem
                        message={msg}
                        onSuggestionClick={handleSuggestionClick}
                        accentColorName={accentColorName}
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
                    <Loader className="w-6 h-6" />
                    <span className="ml-3 text-sm text-muted-foreground animate-pulse">Gemini is thinking...</span>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default EnhancedMessageList;
