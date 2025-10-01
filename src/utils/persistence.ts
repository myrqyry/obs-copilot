// src/utils/persistence.ts
import type { AutomationRule } from '../types/automation';
import { logger } from './logger';

export const STORAGE_KEYS = {
  USER_SETTINGS: 'obs-copilot-user-settings',
  CONNECTION_SETTINGS: 'obs-copilot-connection-settings',
} as const;

export interface UserSettings {
  theme: {
    accent: string;
    secondaryAccent: string;
    userChatBubble: string;
    modelChatBubble: string;
  };
  currentTheme?: 'light' | 'dark' | 'system'; // Added currentTheme
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
  automationRules?: AutomationRule[]; // Automation rules for OBS event triggers
}

export interface ConnectionSettings {
  obsUrl: string;
  obsPassword?: string; // SECURITY: Do not persist OBS passwords. Prompt per session and keep in memory only.
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
    logger.warn('Failed to parse stored settings, using defaults:', error);
    return fallback;
  }
}

/**
 * Safely stringify and store data to localStorage
 */
function safeStore(key: string, data: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    logger.warn('Failed to store settings:', error);
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
  const parsed = safeParseJSON<Partial<ConnectionSettings>>(stored, {});
  // SECURITY MIGRATION: strip any legacy persisted password if present
  if ('obsPassword' in (parsed as any)) {
    delete (parsed as any).obsPassword;
  }
  return parsed;
}

/**
 * Save connection settings to localStorage
 */
export function saveConnectionSettings(settings: Partial<ConnectionSettings>): void {
  const existing = loadConnectionSettings();
  const merged = { ...existing, ...settings };
  // SECURITY: ensure no password is persisted even if inadvertently passed
  if ('obsPassword' in (merged as any)) {
    delete (merged as any).obsPassword;
  }
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
    logger.warn('Failed to clear settings:', error);
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
      logger.error('Fallback: Oops, unable to copy', err);
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
