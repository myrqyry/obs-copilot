import type { AutomationRule } from '../types/automation';
export declare const STORAGE_KEYS: {
    readonly USER_SETTINGS: "obs-copilot-user-settings";
    readonly CONNECTION_SETTINGS: "obs-copilot-connection-settings";
};
export interface UserSettings {
    theme: {
        accent: string;
        secondaryAccent: string;
        userChatBubble: string;
        modelChatBubble: string;
    };
    flipSides: boolean;
    autoApplySuggestions: boolean;
    extraDarkMode: boolean;
    customChatBackground?: string;
    bubbleFillOpacity?: number;
    backgroundOpacity?: number;
    chatBackgroundBlendMode?: string;
    chatBubbleBlendMode?: string;
    streamerName?: string;
    geminiApiKey?: string;
    userDefinedContext?: string[];
    automationRules?: AutomationRule[];
}
export interface ConnectionSettings {
    obsWebSocketUrl: string;
    obsPassword?: string;
    rememberApiKey: boolean;
    autoConnect: boolean;
    streamerBotAddress?: string;
    streamerBotPort?: string;
}
/**
 * Load user settings from localStorage
 */
export declare function loadUserSettings(): Partial<UserSettings>;
/**
 * Save user settings to localStorage
 */
export declare function saveUserSettings(settings: Partial<UserSettings>): void;
/**
 * Load connection settings from localStorage
 */
export declare function loadConnectionSettings(): Partial<ConnectionSettings>;
/**
 * Save connection settings to localStorage
 */
export declare function saveConnectionSettings(settings: Partial<ConnectionSettings>): void;
/**
 * Clear all stored settings (useful for reset functionality)
 */
export declare function clearAllSettings(): void;
/**
 * Copies text to the clipboard.
 * @param text The text to copy.
 */
export declare function copyToClipboard(text: string): Promise<void>;
/**
 * Check if settings persistence is available
 */
export declare function isStorageAvailable(): boolean;
