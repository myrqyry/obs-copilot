export interface Suggestion {
    id: string;
    label: string;
    prompt: string;
    emoji?: string;
}
export declare const allChatSuggestions: Suggestion[];
export declare const getRandomSuggestions: (count: number) => Suggestion[];
export declare const genericSourcePrompts: string[];
