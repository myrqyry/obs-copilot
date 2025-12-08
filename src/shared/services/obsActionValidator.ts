import { logger } from '@/shared/utils/logger';

export interface ObsAction {
  type: string;
  [key: string]: any;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  suggestion?: string | undefined;
}

export interface BatchValidationResult {
  valid: boolean;
  errors: Array<{ action: ObsAction; error: string; suggestion?: string | undefined }>;
  warnings: Array<{ action: ObsAction; warning: string }>;
}

export class ObsActionValidator {
  /**
   * Validate a single OBS action against current state
   */
  async validate(action: ObsAction, obsState: any): Promise<ValidationResult> {
    // Basic type validation
    if (!action.type) {
      return { valid: false, error: 'Action type is required' };
    }

    switch (action.type) {
      case 'SetCurrentProgramScene':
        return this.validateSetScene(action, obsState);
        
      case 'SetCurrentPreviewScene':
        return this.validateSetScene(action, obsState, true);
        
      case 'SetInputSettings':
      case 'SetInputVolume':
      case 'SetInputMute':
        return this.validateInputAction(action, obsState);
        
      case 'CreateInput':
        return this.validateCreateInput(action, obsState);
        
      case 'RemoveInput':
        return this.validateRemoveInput(action, obsState);
        
      case 'SetSceneItemEnabled':
      case 'SetSceneItemTransform':
        return this.validateSceneItemAction(action, obsState);
        
      case 'StartStream':
        return this.validateStartStream(action, obsState);
        
      case 'StopStream':
        return this.validateStopStream(action, obsState);
        
      case 'StartRecord':
        return this.validateStartRecord(action, obsState);
        
      case 'StopRecord':
        return this.validateStopRecord(action, obsState);
        
      case 'GetSourceScreenshot':
        return this.validateScreenshot(action, obsState);
        
      default:
        // Unknown action - warn but allow
        logger.warn(`[Validator] Unknown action type: ${action.type}`);
        return { valid: true };
    }
  }

  /**
   * Validate a batch of actions together
   */
  async validateBatch(actions: ObsAction[], obsState: any): Promise<BatchValidationResult> {
    const errors: Array<{ action: ObsAction; error: string; suggestion?: string }> = [];
    const warnings: Array<{ action: ObsAction; warning: string }> = [];

    // Check for conflicting actions
    const conflicts = this.detectConflicts(actions);
    for (const conflict of conflicts) {
      warnings.push({
        action: conflict.action,
        warning: conflict.message
      });
    }

    // Validate each action
    for (const action of actions) {
      const result = await this.validate(action, obsState);
      if (!result.valid) {
        errors.push({ 
          action, 
          error: result.error!
          , ...(result.suggestion ? { suggestion: result.suggestion } : {})
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  // ==================== Specific Validators ====================

  private validateSetScene(action: ObsAction, obsState: any, isPreview = false): ValidationResult {
    if (!action.sceneName) {
      return { 
        valid: false, 
        error: 'Missing sceneName parameter',
        suggestion: `Available scenes: ${obsState.available_scenes.join(', ')}`
      };
    }

    if (!obsState.available_scenes || !obsState.available_scenes.includes(action.sceneName)) {
      const closest = this.findClosestMatch(action.sceneName, obsState.available_scenes);
      return { 
        valid: false, 
        error: `Scene "${action.sceneName}" not found`,
        suggestion: closest ? `Did you mean "${closest}"?` : `Available: ${obsState.available_scenes.join(', ')}`
      };
    }

    // Check if already on this scene
    if (!isPreview && obsState.current_scene === action.sceneName) {
      return {
        valid: false,
        error: `Already on scene "${action.sceneName}"`,
        suggestion: 'No action needed'
      };
    }

    return { valid: true };
  }

  private validateInputAction(action: ObsAction, obsState: any): ValidationResult {
    if (!action.inputName) {
      return { 
        valid: false, 
        error: 'Missing inputName parameter',
        suggestion: `Available sources: ${this.getSourceNames(obsState).join(', ')}`
      };
    }

    const sourceExists = obsState.active_sources?.some((s: any) => s.inputName === action.inputName);
    if (!sourceExists) {
      const closest = this.findClosestMatch(action.inputName, this.getSourceNames(obsState));
      return { 
        valid: false, 
        error: `Source "${action.inputName}" not found`,
        suggestion: closest ? `Did you mean "${closest}"?` : undefined
      };
    }

    // Action-specific validation
    if (action.type === 'SetInputVolume') {
      if (action.inputVolumeDb === undefined && action.inputVolumeMul === undefined) {
        return {
          valid: false,
          error: 'Missing volume parameter (inputVolumeDb or inputVolumeMul)',
          suggestion: 'Use inputVolumeDb (e.g., -20.0 to 0.0) or inputVolumeMul (0.0 to 1.0)'
        };
      }
      
      if (action.inputVolumeDb !== undefined) {
        if (action.inputVolumeDb < -100 || action.inputVolumeDb > 0) {
          return {
            valid: false,
            error: `Invalid volume: ${action.inputVolumeDb}dB`,
            suggestion: 'Volume should be between -100dB and 0dB'
          };
        }
      }
    }

    if (action.type === 'SetInputMute') {
      if (typeof action.inputMuted !== 'boolean') {
        return {
          valid: false,
          error: 'inputMuted must be a boolean',
          suggestion: 'Use true to mute, false to unmute'
        };
      }
    }

    return { valid: true };
  }

  private validateCreateInput(action: ObsAction, obsState: any): ValidationResult {
    if (!action.inputName || !action.inputKind) {
      return { 
        valid: false, 
        error: 'Missing inputName or inputKind parameter',
        suggestion: 'Both inputName and inputKind are required'
      };
    }

    // Check for duplicate name
    const duplicate = obsState.active_sources?.some((s: any) => s.inputName === action.inputName);
    if (duplicate) {
      return { 
        valid: false, 
        error: `Source "${action.inputName}" already exists`,
        suggestion: 'Use a different name or remove existing source first'
      };
    }

    // Validate common input kinds
    const validKinds = [
      'browser_source', 'image_source', 'color_source', 'text_gdiplus_v2',
      'ffmpeg_source', 'vlc_source', 'wasapi_input_capture', 'wasapi_output_capture',
      'dshow_input', 'game_capture', 'window_capture', 'monitor_capture'
    ];

    if (!validKinds.includes(action.inputKind)) {
      return {
        valid: false,
        error: `Unknown input kind: ${action.inputKind}`,
        suggestion: `Common types: ${validKinds.slice(0, 5).join(', ')}, ...`
      };
    }

    // Validate required settings per input kind
    if (action.inputKind === 'browser_source' && action.inputSettings) {
      if (!action.inputSettings.url) {
        return {
          valid: false,
          error: 'browser_source requires url in inputSettings',
          suggestion: 'Add inputSettings: { url: "https://..." }'
        };
      }
    }

    return { valid: true };
  }

  private validateRemoveInput(action: ObsAction, obsState: any): ValidationResult {
    if (!action.inputName) {
      return { 
        valid: false, 
        error: 'Missing inputName parameter'
      };
    }

    const sourceExists = obsState.active_sources?.some((s: any) => s.inputName === action.inputName);
    if (!sourceExists) {
      return { 
        valid: false, 
        error: `Source "${action.inputName}" not found`,
        suggestion: 'Cannot remove non-existent source'
      };
    }

    return { valid: true };
  }

  private validateSceneItemAction(action: ObsAction, obsState: any): ValidationResult {
    if (!action.sceneName) {
      return {
        valid: false,
        error: 'Missing sceneName parameter'
      };
    }

    if (!obsState.available_scenes?.includes(action.sceneName)) {
      return {
        valid: false,
        error: `Scene "${action.sceneName}" not found`
      };
    }

    if (action.sceneItemId === undefined && !action.sceneItemName) {
      return {
        valid: false,
        error: 'Missing sceneItemId or sceneItemName parameter',
        suggestion: 'Provide either sceneItemId (number) or sceneItemName (string)'
      };
    }

    return { valid: true };
  }

  private validateStartStream(action: ObsAction, obsState: any): ValidationResult {
    if (obsState.streaming_status) {
      return {
        valid: false,
        error: 'Stream is already active',
        suggestion: 'Stop the stream first or skip this action'
      };
    }
    return { valid: true };
  }

  private validateStopStream(action: ObsAction, obsState: any): ValidationResult {
    if (!obsState.streaming_status) {
      return {
        valid: false,
        error: 'Stream is not active',
        suggestion: 'No need to stop - stream is not running'
      };
    }
    return { valid: true };
  }

  private validateStartRecord(action: ObsAction, obsState: any): ValidationResult {
    if (obsState.recording_status) {
      return {
        valid: false,
        error: 'Recording is already active',
        suggestion: 'Stop recording first or skip this action'
      };
    }
    return { valid: true };
  }

  private validateStopRecord(action: ObsAction, obsState: any): ValidationResult {
    if (!obsState.recording_status) {
      return {
        valid: false,
        error: 'Recording is not active',
        suggestion: 'No need to stop - recording is not running'
      };
    }
    return { valid: true };
  }

  private validateScreenshot(action: ObsAction, obsState: any): ValidationResult {
    if (!action.sourceName) {
      return {
        valid: false,
        error: 'Missing sourceName parameter',
        suggestion: `Use current scene: "${obsState.current_scene}"`
      };
    }

    const validImageFormats = ['png', 'jpg', 'jpeg'];
    if (action.imageFormat && !validImageFormats.includes(action.imageFormat.toLowerCase())) {
      return {
        valid: false,
        error: `Invalid image format: ${action.imageFormat}`,
        suggestion: `Use one of: ${validImageFormats.join(', ')}`
      };
    }

    return { valid: true };
  }

  // ==================== Helper Methods ====================

  private detectConflicts(actions: ObsAction[]): Array<{ action: ObsAction; message: string }> {
    const conflicts: Array<{ action: ObsAction; message: string }> = [];
    const types = actions.map(a => a.type);

    // Check for conflicting stream actions
    if (types.includes('StartStream') && types.includes('StopStream')) {
      const startIdx = types.indexOf('StartStream');
      const stopIdx = types.indexOf('StopStream');
      const maxIdx = Math.max(startIdx, stopIdx);
      const conflictAction = actions[maxIdx] ?? actions[startIdx] ?? actions[stopIdx];
      if (conflictAction) {
        conflicts.push({
          action: conflictAction,
          message: 'Conflicting actions: StartStream and StopStream in same batch'
        });
      }
    }

    // Check for conflicting record actions
    if (types.includes('StartRecord') && types.includes('StopRecord')) {
      const startIdx = types.indexOf('StartRecord');
      const stopIdx = types.indexOf('StopRecord');
      const maxIdx = Math.max(startIdx, stopIdx);
      const conflictAction = actions[maxIdx] ?? actions[startIdx] ?? actions[stopIdx];
      if (conflictAction) {
        conflicts.push({
          action: conflictAction,
          message: 'Conflicting actions: StartRecord and StopRecord in same batch'
        });
      }
    }

    // Check for multiple scene changes
    const sceneChanges = actions.filter(a => a.type === 'SetCurrentProgramScene');
    if (sceneChanges.length > 1) {
      const last = sceneChanges[sceneChanges.length - 1];
      if (last) {
        conflicts.push({
          action: last,
          message: `Multiple scene changes detected (${sceneChanges.length}). Only the last will take effect.`
        });
      }
    }

    // Check for create/remove conflicts
    const creates = actions.filter(a => a.type === 'CreateInput').map(a => a.inputName);
    const removes = actions.filter(a => a.type === 'RemoveInput').map(a => a.inputName);
    const createRemoveOverlap = creates.filter(name => removes.includes(name));
    
    if (createRemoveOverlap.length > 0) {
      const action = actions[0] ?? null;
      if (action) {
        conflicts.push({
          action,
          message: `Sources both created and removed in same batch: ${createRemoveOverlap.join(', ')}`
        });
      }
    }

    return conflicts;
  }

  private getSourceNames(obsState: any): string[] {
    return obsState.active_sources?.map((s: any) => s.inputName) || [];
  }

  private findClosestMatch(target: string, options: string[]): string | null {
    if (!options || options.length === 0) return null;

    const targetLower = target.toLowerCase();
    
    // Exact match (case-insensitive)
    const exactMatch = options.find(opt => opt.toLowerCase() === targetLower);
    if (exactMatch) return exactMatch;

    // Contains match
    const containsMatch = options.find(opt => opt.toLowerCase().includes(targetLower));
    if (containsMatch) return containsMatch;

    // Levenshtein distance for typos
    let closest: string | null = options[0] ?? null;
    let minDistance = closest ? this.levenshteinDistance(targetLower, closest.toLowerCase()) : Number.MAX_SAFE_INTEGER;

    for (const option of options.slice(1)) {
      const distance = this.levenshteinDistance(targetLower, option.toLowerCase());
      if (distance < minDistance) {
        minDistance = distance;
        closest = option;
      }
    }

    // Only suggest if distance is reasonable (less than half the target length)
    if (minDistance <= Math.max(3, target.length / 2)) {
      return closest;
    }

    return null;
  }

  private levenshteinDistance(a: string, b: string): number {
    const alen = a.length;
    const blen = b.length;
    const dp: number[][] = Array.from({ length: alen + 1 }, () => new Array<number>(blen + 1).fill(0));

    for (let i = 0; i <= alen; i++) dp[i][0] = i;
    for (let j = 0; j <= blen; j++) dp[0][j] = j;

    for (let i = 1; i <= alen; i++) {
      for (let j = 1; j <= blen; j++) {
        const cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
      }
    }

    return dp[alen][blen];
  }
}

export const obsActionValidator = new ObsActionValidator();
