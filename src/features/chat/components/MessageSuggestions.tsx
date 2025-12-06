import React from 'react';
import { Suggestions, Suggestion } from '@/shared/components/ai-elements/suggestion';

interface SuggestionType {
    id: string;
    prompt: string;
    emoji: string;
    label: string;
}

interface MessageSuggestionsProps {
    suggestions: SuggestionType[];
    onSuggestionClick: (prompt: string) => void;
}

export const MessageSuggestions: React.FC<MessageSuggestionsProps> = ({ suggestions, onSuggestionClick }) => {
    return (
        <div className="mt-3 pt-3 border-t border-opacity-30">
            <div className="text-sm opacity-90 mb-3 font-normal font-sans"><span className="emoji">✨</span> Try these commands:</div>
            <Suggestions className="grid grid-cols-2 gap-2">
                {suggestions.map((suggestion: any) => (
                    <Suggestion
                        key={suggestion.id}
                        suggestion={suggestion.prompt}
                        onClick={onSuggestionClick}
                        className="text-xs px-2 py-1.5 bg-muted/50 hover:bg-primary/20 text-foreground hover:text-primary-foreground rounded border border-border hover:border-primary transition-all duration-200 text-left group shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    >
                        <span className="mr-1.5 text-sm group-hover:scale-110 transition-transform duration-200 inline-block emoji">{suggestion.emoji}</span>
                        <span className="font-normal">{suggestion.label}</span>
                    </Suggestion>
                ))}
            </Suggestions>
        </div>
    );
};
