import { ObsClientImpl } from '../services/obsClient';
import { logger } from './logger';

export interface AddSourceOptions {
  obsService: ObsClientImpl;
  currentScene?: string | null;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers or non-secure contexts
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  } catch (error) {
    logger.error('Failed to copy to clipboard:', error);
    throw new Error('Failed to copy to clipboard');
  }
}

/**
 * Generate a unique source name based on search query and timestamp
 */
export function generateSourceName(baseName: string, searchQuery?: string): string {
  const timestamp = new Date().toISOString().slice(11, 19).replace(/:/g, '-');
  const sanitizedQuery = searchQuery?.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 20) || '';
  return `${baseName}${sanitizedQuery ? `-${sanitizedQuery}` : ''}-${timestamp}`;
}
