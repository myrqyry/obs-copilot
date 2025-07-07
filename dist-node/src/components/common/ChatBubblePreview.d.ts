import React from 'react';
import { CatppuccinChatBubbleColorName } from '../../types';
interface ChatBubblePreviewProps {
    userColor: CatppuccinChatBubbleColorName;
    modelColor: CatppuccinChatBubbleColorName;
    flipSides: boolean;
    extraDarkMode: boolean;
    customBackground?: string;
    bubbleFillOpacity?: number;
    backgroundOpacity?: number;
    chatBackgroundBlendMode?: React.CSSProperties['mixBlendMode'];
    chatBubbleBlendMode?: React.CSSProperties['mixBlendMode'];
}
export declare const ChatBubblePreview: React.FC<ChatBubblePreviewProps>;
export {};
