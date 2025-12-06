import React from 'react';
import { ChatMessage } from '@/shared/types';

interface ChoicePromptProps {
    message: ChatMessage;
    onSuggestionClick?: (prompt: string) => void;
    onAddToContext?: (text: string) => void;
}

const getEmojiForChoiceType = (choiceType?: string) => {
    switch (choiceType) {
        case 'scene': return '🎬';
        case 'source': return '🎯';
        case 'camera-source': return '📹';
        case 'audio-source': return '🎵';
        case 'text-source': return '📝';
        case 'screen-source': return '🖥️';
        case 'source-filter': return '🎨';
        default: return '🤔';
    }
};

const getTitleForChoiceType = (choiceType?: string) => {
    switch (choiceType) {
        case 'scene': return 'Select a scene:';
        case 'source': return 'Select a source:';
        case 'camera-source': return 'Select a camera:';
        case 'audio-source': return 'Select an audio source:';
        case 'text-source': return 'Select a text source:';
        case 'screen-source': return 'Select a screen capture:';
        case 'source-filter': return 'Select a source for filters:';
        default: return 'Choose an option:';
    }
}

export const ChoicePrompt: React.FC<ChoicePromptProps> = ({ message, onSuggestionClick, onAddToContext }) => {
    if (!message.choices) return null;

    const handleChoiceClick = (choice: string) => {
        if (onAddToContext) {
            const contextText = `Previous assistant: ${message.text}`;
            onAddToContext(contextText);
        }
        if (onSuggestionClick) {
            onSuggestionClick(choice);
        }
    };

    return (
        <div className="mt-3 pt-3 border-t border-opacity-30">
            <div className="text-sm opacity-90 mb-3 font-normal font-sans">
                <span className="emoji">{getEmojiForChoiceType(message.choiceType)}</span>{' '}
                {getTitleForChoiceType(message.choiceType)}
            </div>
            <div className={`grid gap-2 ${message.choices.length > 4 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {message.choices.map((choice, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleChoiceClick(choice)}
                        className="text-sm px-3 py-2 bg-background/80 hover:bg-primary hover:text-primary-foreground rounded border border-border hover:border-primary transition-all duration-200 text-left group shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    >
                        <span className="mr-2 text-sm font-medium text-primary group-hover:text-primary-foreground">
                            {String.fromCharCode(65 + idx)})
                        </span>
                        <span className="font-normal">{choice}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};
