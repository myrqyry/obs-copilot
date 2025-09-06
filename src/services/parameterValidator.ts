import { logger } from '@/utils/logger';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateActionParameters(action: string, params: Record<string, any>): ValidationResult {
  switch (action) {
    case 'switch_scene':
      if (!params.sceneName || typeof params.sceneName !== 'string') {
        return { valid: false, error: 'sceneName must be a non-empty string' };
      }
      break;
    case 'set_volume':
      if (!params.inputName || typeof params.inputName !== 'string') {
        return { valid: false, error: 'inputName must be a non-empty string' };
      }
      if (typeof params.inputVolumeDb !== 'number' || params.inputVolumeDb < -60 || params.inputVolumeDb > 0) {
        return { valid: false, error: 'inputVolumeDb must be a number between -60 and 0' };
      }
      break;
    case 'toggle_mute':
      if (!params.inputName || typeof params.inputName !== 'string') {
        return { valid: false, error: 'inputName must be a non-empty string' };
      }
      if (params.inputMuted !== undefined && typeof params.inputMuted !== 'boolean') {
        return { valid: false, error: 'inputMuted must be a boolean or undefined' };
      }
      break;
    case 'set_source_settings':
      if (!params.inputName || typeof params.inputName !== 'string') {
        return { valid: false, error: 'inputName must be a non-empty string' };
      }
      if (!params.inputSettings || typeof params.inputSettings !== 'object') {
        return { valid: false, error: 'inputSettings must be a non-empty object' };
      }
      break;
    case 'get_scene_list':
      // No params needed
      break;
    case 'get_current_scene':
      // No params needed
      break;
    case 'set_scene_item_enabled':
      if (!params.sceneName || typeof params.sceneName !== 'string') {
        return { valid: false, error: 'sceneName must be a non-empty string' };
      }
      if (!params.sceneItemId || typeof params.sceneItemId !== 'string') {
        return { valid: false, error: 'sceneItemId must be a non-empty string' };
      }
      if (params.sceneItemEnabled !== undefined && typeof params.sceneItemEnabled !== 'boolean') {
        return { valid: false, error: 'sceneItemEnabled must be a boolean or undefined' };
      }
      break;
    case 'set_scene_item_transform':
      if (!params.sceneName || typeof params.sceneName !== 'string') {
        return { valid: false, error: 'sceneName must be a non-empty string' };
      }
      if (!params.sceneItemId || typeof params.sceneItemId !== 'string') {
        return { valid: false, error: 'sceneItemId must be a non-empty string' };
      }
      if (!params.sceneItemTransform || typeof params.sceneItemTransform !== 'object') {
        return { valid: false, error: 'sceneItemTransform must be a non-empty object' };
      }
      break;
    case 'toggle_scene_item':
      if (!params.sceneName || typeof params.sceneName !== 'string') {
        return { valid: false, error: 'sceneName must be a non-empty string' };
      }
      if (!params.sceneItemId || typeof params.sceneItemId !== 'string') {
        return { valid: false, error: 'sceneItemId must be a non-empty string' };
      }
      if (params.enabled !== undefined && typeof params.enabled !== 'boolean') {
        return { valid: false, error: 'enabled must be a boolean or undefined' };
      }
      break;
    case 'transition_to_scene':
      if (!params.sceneName || typeof params.sceneName !== 'string') {
        return { valid: false, error: 'sceneName must be a non-empty string' };
      }
      break;
    case 'set_transition':
      if (!params.sceneName || typeof params.sceneName !== 'string') {
        return { valid: false, error: 'sceneName must be a non-empty string' };
      }
      if (!params.transitionName || typeof params.transitionName !== 'string') {
        return { valid: false, error: 'transitionName must be a non-empty string' };
      }
      break;
    case 'set_filter':
      if (!params.inputName || typeof params.inputName !== 'string') {
        return { valid: false, error: 'inputName must be a non-empty string' };
      }
      if (!params.filterName || typeof params.filterName !== 'string') {
        return { valid: false, error: 'filterName must be a non-empty string' };
      }
      if (!params.filterSettings || typeof params.filterSettings !== 'object') {
        return { valid: false, error: 'filterSettings must be a non-empty object' };
      }
      break;
    case 'toggle_filter':
      if (!params.inputName || typeof params.inputName !== 'string') {
        return { valid: false, error: 'inputName must be a non-empty string' };
      }
      if (!params.filterName || typeof params.filterName !== 'string') {
        return { valid: false, error: 'filterName must be a non-empty string' };
      }
      if (params.filterEnabled !== undefined && typeof params.filterEnabled !== 'boolean') {
        return { valid: false, error: 'filterEnabled must be a boolean or undefined' };
      }
      break;
    default:
      return { valid: false, error: `Unknown action type: ${action}` };
  }

  return { valid: true };
}

// Usage in actionMapper or elsewhere
export function validateAndExecute(config: UniversalWidgetConfig, action: string, params: Record<string, any>) {
  const result = validateActionParameters(action, params);
  if (!result.valid) {
    logger.error(`Parameter validation failed for action ${action}: ${result.error}`);
    throw new Error(result.error || 'Validation failed');
  }
  // Proceed with execution
  return ActionMapper.executeAction(config, action, params);
}