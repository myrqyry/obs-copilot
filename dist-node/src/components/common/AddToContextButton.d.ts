import React from 'react';
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
declare const AddToContextButton: React.FC<AddToContextButtonProps>;
export default AddToContextButton;
