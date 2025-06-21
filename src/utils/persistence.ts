// src/utils/persistence.ts

export const STORAGE_KEYS = {
    USER_SETTINGS: 'obs-copilot-user-settings',
    CONNECTION_SETTINGS: 'obs-copilot-connection-settings'
} as const;

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
    chatBubbleBlendMode?: string; // New: blend mode for chat bubble fills
    streamerName?: string;
    geminiApiKey?: string; // Optional - user can choose to persist this
    userDefinedContext?: string[]; // Array to store user-added contexts
}

export interface ConnectionSettings {
    obsWebSocketUrl: string;
    obsPassword?: string; // Optional - might be sensitive
    rememberApiKey: boolean; // User preference for persisting API key
    autoConnect: boolean; // Auto-connect to OBS on app reload
    streamerBotAddress?: string; // Streamer.bot connection address
    streamerBotPort?: string; // Streamer.bot connection port
}

/**
 * Safely parse JSON from localStorage
 */
function safeParseJSON<T>(jsonString: string | null, fallback: T): T {
    if (!jsonString) return fallback;

    try {
        return JSON.parse(jsonString) as T;
    } catch (error) {
        console.warn('Failed to parse stored settings, using defaults:', error);
        return fallback;
    }
}

/**
 * Safely stringify and store data to localStorage
 */
function safeStore(key: string, data: any): void {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.warn('Failed to store settings:', error);
    }
}

/**
 * Load user settings from localStorage
 */
export function loadUserSettings(): Partial<UserSettings> {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
    return safeParseJSON(stored, {});
}

/**
 * Save user settings to localStorage
 */
export function saveUserSettings(settings: Partial<UserSettings>): void {
    const existing = loadUserSettings();
    const merged = { ...existing, ...settings };
    safeStore(STORAGE_KEYS.USER_SETTINGS, merged);
}

/**
 * Load connection settings from localStorage
 */
export function loadConnectionSettings(): Partial<ConnectionSettings> {
    const stored = localStorage.getItem(STORAGE_KEYS.CONNECTION_SETTINGS);
    return safeParseJSON(stored, {});
}

/**
 * Save connection settings to localStorage
 */
export function saveConnectionSettings(settings: Partial<ConnectionSettings>): void {
    const existing = loadConnectionSettings();
    const merged = { ...existing, ...settings };
    safeStore(STORAGE_KEYS.CONNECTION_SETTINGS, merged);
}

/**
 * Clear all stored settings (useful for reset functionality)
 */
export function clearAllSettings(): void {
    try {
        localStorage.removeItem(STORAGE_KEYS.USER_SETTINGS);
        localStorage.removeItem(STORAGE_KEYS.CONNECTION_SETTINGS);
    } catch (error) {
        console.warn('Failed to clear settings:', error);
    }
}

/**
 * Copies text to the clipboard.
 * @param text The text to copy.
 */
export async function copyToClipboard(text: string): Promise<void> {
    if (!navigator.clipboard) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed'; // Avoid scrolling to bottom
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
        } catch (err) {
            console.error('Fallback: Oops, unable to copy', err);
        }
        document.body.removeChild(textArea);
        return;
    }
    await navigator.clipboard.writeText(text);
}

/**
 * Check if settings persistence is available
 */
export function isStorageAvailable(): boolean {
    try {
        const test = '__storage_test__';
        localStorage.setItem(test, 'test');
        localStorage.removeItem(test);
        return true;
    } catch {
        return false;
    }
}
