import React from 'react';
import Tooltip from '../ui/Tooltip'; // correct path for common/
import { ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/solid';
import { useAppStore } from '../../store/appStore';

interface AddToContextButtonProps {
    contextText: string;
    disabled?: boolean;
    title?: string;
    className?: string;
}

/**
 * Reusable button to add any text to Gemini/chat context.
 * Uses the onSendToGeminiContext handler from the store if available, otherwise falls back to a system message.
 */
const AddToContextButton: React.FC<AddToContextButtonProps> = ({ contextText, disabled, title, className }) => {
    const addMessage = useAppStore((state) => state.actions.addMessage);
    // Use a central handler if available, fallback to addMessage
    // You can add onSendToGeminiContext to your store for more advanced routing
    const onSendToGeminiContext = useAppStore((state: any) => state.onSendToGeminiContext) || ((text: string) => addMessage({ role: 'system', text }));

    return (
        <Tooltip content={title || 'Add to chat context'}>
            <button
                type="button"
                className={`ml-1 p-1 rounded hover:bg-accent/20 transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 ${className || ''}`}
                disabled={disabled}
                onClick={() => onSendToGeminiContext(contextText)}
                aria-label={title || 'Add to chat context'}
            >
                <ChatBubbleLeftEllipsisIcon className="w-5 h-5 text-accent" />
            </button>
        </Tooltip>
    );
};

export default AddToContextButton;
