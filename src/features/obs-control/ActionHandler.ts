import { ObsClientImpl } from '@/services/obsClient';
import { 
  ActionHandler, 
  ActionResult, 
  ActionExecutionContext, 
  WidgetError, 
  ValidationResult,
  ActionValidation,
  RetryConfig,
  ActionHandlerFunc
} from './types';
import { logger } from '@/utils/logger';

const obsClient = ObsClientImpl.getInstance();

/**
 * Action Handler System for Universal Widget Engine
 * Provides dynamic action validation and execution for all OBS WebSocket operations
 */
export class ActionHandlerSystem {
  private static instance: ActionHandlerSystem;
  private handlers: Map<string, ActionHandler> = new Map();
  private validators: Map<string, ActionValidation> = new Map();
  private retryConfigs: Map<string, RetryConfig> = new Map();

  private constructor() {
    this.initializeDefaultHandlers();
  }

  public static getInstance(): ActionHandlerSystem {
    if (!ActionHandlerSystem.instance) {
      ActionHandlerSystem.instance = new ActionHandlerSystem();
    }
    return ActionHandlerSystem.instance;
  }

  /**
   * Initialize default action handlers for common OBS operations
   */
  private initializeDefaultHandlers(): void {
    // Streaming controls
    this.registerHandler('StartStream', this.createStreamHandler('StartStream'));
    this.registerHandler('StopStream', this.createStreamHandler('StopStream'));
    this.registerHandler('GetStreamStatus', this.createStatusHandler('GetStreamStatus'));

    // Recording controls
    this.registerHandler('StartRecord', this.createRecordHandler('StartRecord'));
    this.registerHandler('StopRecord', this.createRecordHandler('StopRecord'));
    this.registerHandler('GetRecordStatus', this.createStatusHandler('GetRecordStatus'));

    // Scene controls
    this.registerHandler('SetCurrentProgramScene', this.createSceneHandler('SetCurrentProgramScene'));
    this.registerHandler('GetSceneList', this.createSceneHandler('GetSceneList'));
    this.registerHandler('GetCurrentProgramScene', this.createSceneHandler('GetCurrentProgramScene'));

    // Source controls
    this.registerHandler('SetInputMute', this.createInputHandler('SetInputMute'));
    this.registerHandler('ToggleInputMute', this.createInputHandler('ToggleInputMute'));
    this.registerHandler('GetInputMute', this.createInputHandler('GetInputMute'));
    this.registerHandler('SetInputVolume', this.createVolumeHandler('SetInputVolume'));
    this.registerHandler('GetInputVolume', this.createVolumeHandler('GetInputVolume'));

    // Virtual camera
    this.registerHandler('StartVirtualCam', this.createVirtualCamHandler('StartVirtualCam'));
    this.registerHandler('StopVirtualCam', this.createVirtualCamHandler('StopVirtualCam'));
    this.registerHandler('GetVirtualCamStatus', this.createStatusHandler('GetVirtualCamStatus'));

    // Studio mode
    this.registerHandler('TriggerStudioModeTransition', this.createStudioModeHandler('TriggerStudioModeTransition'));
    this.registerHandler('GetStudioModeEnabled', this.createStatusHandler('GetStudioModeEnabled'));

    // Replay buffer
    this.registerHandler('StartReplayBuffer', this.createReplayBufferHandler('StartReplayBuffer'));
    this.registerHandler('StopReplayBuffer', this.createReplayBufferHandler('StopReplayBuffer'));
    this.registerHandler('SaveReplayBuffer', this.createReplayBufferHandler('SaveReplayBuffer'));

    // Set default retry configurations
    this.setDefaultRetryConfigs();
  }

  private setDefaultRetryConfigs(): void {
    const defaultRetryConfig: RetryConfig = {
      maxRetries: 3,
      retryDelay: 1000,
      backoffMultiplier: 2,
      maxDelay: 10000
    };

    this.handlers.forEach((_, actionId) => {
      this.retryConfigs.set(actionId, defaultRetryConfig);
    });

    // Special configurations for specific actions
    this.retryConfigs.set('StartStream', { ...defaultRetryConfig, maxRetries: 5 });
    this.retryConfigs.set('StopStream', { ...defaultRetryConfig, maxRetries: 5 });
    this.retryConfigs.set('StartRecord', { ...defaultRetryConfig, maxRetries: 3 });
    this.retryConfigs.set('StopRecord', { ...defaultRetryConfig, maxRetries: 3 });
  }

  /**
   * Register a custom action handler
   */
  public registerHandler(actionId: string, handler: ActionHandler, validation?: ActionValidation): void {
    this.handlers.set(actionId, handler);
    if (validation) {
      this.validators.set(actionId, validation);
    }
    logger.info(`Registered action handler: ${actionId}`);
  }

  /**
   * Get action handler by ID
   */
  public getHandler(actionId: string): ActionHandler | undefined {
    return this.handlers.get(actionId);
  }

  /**
   * Validate action parameters
   */
  public async validateAction(actionId: string, params?: Record<string, any>): Promise<ValidationResult> {
    const validation = this.validators.get(actionId);
    if (!validation) {
      return { valid: true };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required parameters
    if (validation.requiredParams) {
      for (const param of validation.requiredParams) {
        if (params?.[param] === undefined || params?.[param] === null) {
          errors.push(`Required parameter '${param}' is missing`);
        }
      }
    }

    // Check parameter types
    if (validation.paramTypes && params) {
      for (const [param, expectedType] of Object.entries(validation.paramTypes)) {
        const value = params[param];
        if (value !== undefined && value !== null) {
          const actualType = typeof value;
          if (actualType !== expectedType) {
            errors.push(`Parameter '${param}' has incorrect type. Expected ${expectedType}, got ${actualType}`);
          }
        }
      }
    }

    // Check value ranges
    if (validation.valueRanges && params) {
      for (const [param, range] of Object.entries(validation.valueRanges)) {
        const value = params[param];
        if (typeof value === 'number') {
          if (range.min !== undefined && value < range.min) {
            errors.push(`Parameter '${param}' is below minimum value ${range.min}`);
          }
          if (range.max !== undefined && value > range.max) {
            errors.push(`Parameter '${param}' is above maximum value ${range.max}`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Execute an action with validation and retry logic
   */
  public async executeAction(
    actionId: string,
    context: ActionExecutionContext,
    params?: Record<string, any>
  ): Promise<ActionResult> {
    const handler = this.getHandler(actionId);
    if (!handler) {
      return {
        success: false,
        error: new WidgetError(`No handler registered for action: ${actionId}`, 'NO_HANDLER'),
        retryable: false
      };
    }

    // Use parameters as-is for now
    const mappedParams = params || {};

    // Validate action parameters
    const validation = await this.validateAction(actionId, mappedParams);
    if (!validation.valid) {
      return {
        success: false,
        error: new WidgetError(
          `Validation failed: ${validation.errors?.join(', ')}`,
          'VALIDATION_FAILED'
        ),
        retryable: false
      };
    }

    // Execute with retry logic
    const retryConfig = this.retryConfigs.get(actionId) || {
      maxRetries: 3,
      retryDelay: 1000,
      backoffMultiplier: 2,
      maxDelay: 10000
    };

    let lastError: WidgetError | undefined;
    let retryCount = 0;

    while (retryCount <= retryConfig.maxRetries) {
      try {
        let result: ActionResult;
        
        // Handle both ActionHandlerFunc and object types
        if (typeof handler === 'function') {
          // Direct function call (ActionHandlerFunc)
          result = await (handler as ActionHandlerFunc)(context, mappedParams);
        } else {
          // Object with optional validate and required execute
          if (handler.validate) {
            const valResult = await handler.validate(mappedParams);
            if (!valResult.valid) {
              throw new WidgetError(`Handler validation failed: ${valResult.errors?.join(', ')}`, 'HANDLER_VALIDATION_FAILED');
            }
          }
          result = await handler.execute(context, mappedParams);
        }

        if (result.success) {
          logger.info(`Action ${actionId} executed successfully`);
          return result;
        } else if (!result.retryable || retryCount >= retryConfig.maxRetries) {
          return result;
        }
        lastError = result.error as WidgetError;
      } catch (error) {
        lastError = new WidgetError(
          `Action execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'EXECUTION_FAILED',
          true
        );
      }

      if (retryCount < retryConfig.maxRetries) {
        const delay = Math.min(
          retryConfig.retryDelay * Math.pow(retryConfig.backoffMultiplier, retryCount),
          retryConfig.maxDelay
        );
        logger.warn(`Action ${actionId} failed, retrying in ${delay}ms (attempt ${retryCount + 1}/${retryConfig.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      retryCount++;
    }

    return {
      success: false,
      error: lastError || new WidgetError(`Action ${actionId} failed after ${retryConfig.maxRetries} retries`, 'MAX_RETRIES'),
      retryable: false
    };
  }

  /**
   * Create a generic OBS call handler
   */
  private createGenericHandler(method: string): ActionHandler {
    return async (_context: ActionExecutionContext, params?: Record<string, any>): Promise<ActionResult> => {
      try {
        if (!obsClient.isConnected()) {
          return {
            success: false,
            error: new WidgetError('OBS not connected', 'NOT_CONNECTED'),
            retryable: true
          };
        }

        const result = await obsClient.call(method, params);
        return {
          success: true,
          data: result
        };
      } catch (error) {
        logger.error(`OBS call failed for ${method}:`, error);
        return {
          success: false,
          error: new WidgetError(
            `OBS call failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            'OBS_CALL_FAILED',
            true
          ),
          retryable: true
        };
      }
    };
  }

  /**
   * Create streaming-related handlers
   */
  private createStreamHandler(action: string): ActionHandler {
    return this.createGenericHandler(action);
  }

  /**
   * Create recording-related handlers
   */
  private createRecordHandler(action: string): ActionHandler {
    return this.createGenericHandler(action);
  }

  /**
   * Create scene-related handlers
   */
  private createSceneHandler(action: string): ActionHandler {
    return this.createGenericHandler(action);
  }

  /**
   * Create input-related handlers
   */
  private createInputHandler(action: string): ActionHandler {
    return this.createGenericHandler(action);
  }

  /**
   * Create volume-related handlers with special validation
   */
  private createVolumeHandler(action: string): ActionHandler {
    return async (context: ActionExecutionContext, params?: Record<string, any>): Promise<ActionResult> => {
      if (action === 'SetInputVolume' && params?.inputVolumeDb !== undefined) {
        // Validate volume range (-60 to 0 dB)
        const volume = params.inputVolumeDb;
        if (typeof volume === 'number' && (volume < -60 || volume > 0)) {
          return {
            success: false,
            error: new WidgetError('Volume must be between -60 and 0 dB', 'INVALID_VOLUME'),
            retryable: false
          };
        }
      }
      const handler = this.createGenericHandler(action);
      return typeof handler === 'function' ? handler(context, params) : handler.execute(context, params);
    };
  }

  /**
   * Create virtual camera handlers
   */
  private createVirtualCamHandler(action: string): ActionHandler {
    return this.createGenericHandler(action);
  }

  /**
   * Create studio mode handlers
   */
  private createStudioModeHandler(action: string): ActionHandler {
    return this.createGenericHandler(action);
  }

  /**
   * Create replay buffer handlers
   */
  private createReplayBufferHandler(action: string): ActionHandler {
    return this.createGenericHandler(action);
  }

  /**
   * Create status handlers
   */
  private createStatusHandler(action: string): ActionHandler {
    return this.createGenericHandler(action);
  }

  /**
   * Get all registered action IDs
   */
  public getRegisteredActions(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Remove a handler
   */
  public unregisterHandler(actionId: string): void {
    this.handlers.delete(actionId);
    this.validators.delete(actionId);
    this.retryConfigs.delete(actionId);
    logger.info(`Unregistered action handler: ${actionId}`);
  }

  /**
   * Clear all handlers
   */
  public clearHandlers(): void {
    this.handlers.clear();
    this.validators.clear();
    this.retryConfigs.clear();
    logger.info('Cleared all action handlers');
  }
}

// Export singleton instance
export const actionHandlers = ActionHandlerSystem.getInstance();