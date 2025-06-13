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
    streamerName?: string;
    geminiApiKey?: string; // Optional - user can choose to persist this
}

export interface ConnectionSettings {
    obsWebSocketUrl: string;
    obsPassword?: string; // Optional - might be sensitive
    rememberApiKey: boolean; // User preference for persisting API key
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
