import React from 'react';
import { ChatMessage, CatppuccinAccentColorName, OBSSource, CatppuccinChatBubbleColorName } from '../../types';
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
export declare const ChatMessageItem: React.FC<ChatMessageItemProps>;
export {};
