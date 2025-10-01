import React, { useCallback } from 'react';
import { Clipboard, RefreshCw, MessageCircle } from 'lucide-react';
import { Tooltip } from "@/components/ui";
import { ChatMessage } from '@/types';

interface MessageActionsProps {
    message: ChatMessage;
    isUser: boolean;
    isAssistant: boolean;
    onRegenerate?: (messageId: string) => void;
    onAddToContext?: (text: string) => void;
}

export const MessageActions: React.FC<MessageActionsProps> = ({
    message,
    isUser,
    isAssistant,
    onRegenerate,
    onAddToContext,
}) => {
    const handleCopyText = async () => {
        try {
            await navigator.clipboard.writeText(message.text);
        } catch (err) {
            console.error('Failed to copy text:', err);
        }
    };

    const handleAddToContextLocal = () => {
        if (onAddToContext) {
            const contextText = `Previous ${message.role}: ${message.text}`;
            onAddToContext(contextText);
        }
    };

    const handleRegenerate = useCallback(() => {
        if (onRegenerate && message.id) {
            onRegenerate(message.id);
        }
    }, [onRegenerate, message.id]);

    return (
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
                        onClick={handleRegenerate}
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
    );
};
