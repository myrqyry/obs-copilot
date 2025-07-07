import { OBSWebSocketService } from '../services/obsService';
export interface AddSourceOptions {
    obsService: OBSWebSocketService;
    currentScene?: string | null;
    onSuccess?: (message: string) => void;
    onError?: (error: string) => void;
}
/**
 * Copy text to clipboard
 */
export declare function copyToClipboard(text: string): Promise<void>;
/**
 * Generate a unique source name based on search query and timestamp
 */
export declare function generateSourceName(baseName: string, searchQuery?: string): string;
