import { ObsAction } from '@/shared/types/obsActions';
import { logger } from '@/shared/utils/logger';

class CommandValidationService {
  private allowedObsActionTypes: Set<string> = new Set([
    'createInput',
    'setInputSettings',
    'setSceneItemEnabled',
  ]);

  public validateObsAction(action: ObsAction): boolean {
    if (!this.allowedObsActionTypes.has(action.type)) {
      logger.error(`[Validation] Disallowed OBS action type: ${action.type}`);
      return false;
    }

    // Add parameter validation here
    for (const key in action) {
      if (typeof (action as any)[key] === 'string') {
        if (this.isPotentiallyMalicious((action as any)[key])) {
          logger.error(`[Validation] Potentially malicious string found in OBS action parameter ${key}: ${(action as any)[key]}`);
          return false;
        }
      }
    }

    return true;
  }

  private isPotentiallyMalicious(value: string): boolean {
    // Basic check for script tags and other obvious attack vectors
    const maliciousPatterns = [/<script>/i, /onerror=/i, /onload=/i, /javascript:/i];
    return maliciousPatterns.some(pattern => pattern.test(value));
  }
}

export const commandValidationService = new CommandValidationService();
