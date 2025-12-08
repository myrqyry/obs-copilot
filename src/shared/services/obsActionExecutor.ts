import { logger } from '@/shared/utils/logger';
import { obsClient } from './obsClient';
import { ObsAction, obsActionValidator } from './obsActionValidator';

export interface ActionResult {
  success: boolean;
  error?: string;
  data?: any;
}

export interface ActionContext {
  executedActions: Array<{ action: ObsAction; result: any }>;
  rollbackStack: Array<() => Promise<void>>;
  originalState: any;
}

export interface ExecutionResult {
  success: boolean;
  error?: string;
  partialResults?: Array<{ action: ObsAction; result: ActionResult }>;
  failedAt?: number;
}

export class ObsActionExecutor {
  private readonly ACTION_DELAY_MS = 100;

  /**
   * Execute actions with transaction semantics (rollback on failure)
   */
  async executeActionsWithTransaction(
    actions: ObsAction[],
    handleObsAction: (action: ObsAction) => Promise<ActionResult>,
    obsState: any,
    onProgress?: (completed: number, total: number, currentAction: string) => void
  ): Promise<ExecutionResult> {
    logger.info(`[ActionExecutor] Starting transaction with ${actions.length} actions`);

    // Validate all actions first
    const validation = await obsActionValidator.validateBatch(actions, obsState);
    
    if (!validation.valid) {
      const errorDetails = validation.errors.map(e => 
        `${e.action.type}: ${e.error}${e.suggestion ? ` (${e.suggestion})` : ''}`
      ).join('\n');
      
      return {
        success: false,
        error: `Action validation failed:\n${errorDetails}`,
        partialResults: []
      };
    }

    // Log warnings
    for (const warning of validation.warnings) {
      logger.warn(`[ActionExecutor] ${warning.action.type}: ${warning.warning}`);
    }

    const context: ActionContext = {
      executedActions: [],
      rollbackStack: [],
      originalState: obsState
    };

    try {
      // Sort actions by dependency priority
      const sortedActions = this.sortActionsByDependency(actions);
      
      const results: Array<{ action: ObsAction; result: ActionResult }> = [];

      for (let i = 0; i < sortedActions.length; i++) {
        const action = sortedActions[i];
        if (!action) continue;
        
        // Add delay between actions to avoid overwhelming OBS
        if (i > 0) {
          await this.delay(this.ACTION_DELAY_MS);
        }
        
        logger.info(`[ActionExecutor] Executing ${i + 1}/${sortedActions.length}: ${action.type}`);
        
        if (onProgress) {
          onProgress(i, sortedActions.length, action.type ?? 'unknown');
        }

        let result: ActionResult;
        try {
          result = await handleObsAction(action);
        } catch (error) {
          result = {
            success: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }

        if (!result.success) {
          logger.error(`[ActionExecutor] Action failed: ${action.type} - ${result.error}`);
          
          // Rollback all previous actions
          await this.rollback(context);
          
          return {
            success: false,
            error: `Action "${action.type}" failed: ${result.error}. All changes have been rolled back.`,
            partialResults: results,
            failedAt: i
          };
        }

        // Success - store result and register rollback
        context.executedActions.push({ action, result: result.data });
        results.push({ action, result });
        
        const rollbackAction = this.createRollbackAction(action, result.data, context.originalState);
        if (rollbackAction) {
          context.rollbackStack.push(rollbackAction);
        }
      }

      if (onProgress) {
        onProgress(sortedActions.length, sortedActions.length, 'Complete');
      }

      logger.info(`[ActionExecutor] Transaction completed successfully`);
      return { success: true, partialResults: results };

    } catch (error) {
      logger.error('[ActionExecutor] Unexpected error during execution:', error);
      await this.rollback(context);
      
      return {
        success: false,
        error: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
        partialResults: []
      };
    }
  }

  /**
   * Sort actions by dependency priority
   */
  private sortActionsByDependency(actions: ObsAction[]): ObsAction[] {
    const priorities: Record<string, number> = {
      // Create operations first
      'CreateScene': 1,
      'CreateInput': 2,
      'CreateSceneItem': 3,
      
      // Configure before showing
      'SetInputSettings': 4,
      'SetInputVolume': 4,
      'SetInputMute': 4,
      'SetSceneItemTransform': 4,
      
      // Then enable/show
      'SetSceneItemEnabled': 5,
      
      // Scene switching
      'SetCurrentProgramScene': 6,
      'SetCurrentPreviewScene': 6,
      
      // Output controls last
      'StartStream': 10,
      'StopStream': 10,
      'StartRecord': 10,
      'StopRecord': 10,
      
      // Remove operations last
      'RemoveInput': 15,
      'RemoveScene': 15
    };

    return [...actions].sort((a, b) => {
      const priorityA = priorities[a.type] || 5;
      const priorityB = priorities[b.type] || 5;
      return priorityA - priorityB;
    });
  }

  /**
   * Create a rollback action for successful operations
   */
  private createRollbackAction(
    action: ObsAction,
    _resultData: any,
    originalState: any
  ): (() => Promise<void>) | null {
    switch (action.type) {
      case 'CreateInput':
        return async () => {
          try {
            await obsClient.call('RemoveInput', { inputName: action.inputName });
            logger.info(`[Rollback] Removed input: ${action.inputName}`);
          } catch (error) {
            logger.warn(`[Rollback] Failed to remove input ${action.inputName}:`, error);
          }
        };

      case 'CreateScene':
        return async () => {
          try {
            await obsClient.call('RemoveScene', { sceneName: action.sceneName });
            logger.info(`[Rollback] Removed scene: ${action.sceneName}`);
          } catch (error) {
            logger.warn(`[Rollback] Failed to remove scene ${action.sceneName}:`, error);
          }
        };

      case 'SetCurrentProgramScene':
        return async () => {
          try {
            if (originalState.current_scene) {
              await obsClient.call('SetCurrentProgramScene', { 
                sceneName: originalState.current_scene 
              });
              logger.info(`[Rollback] Restored scene: ${originalState.current_scene}`);
            }
          } catch (error) {
            logger.warn(`[Rollback] Failed to restore scene:`, error);
          }
        };

      case 'SetSceneItemEnabled':
        // Would need to capture original state before action
        return async () => {
          try {
            // Toggle back to original state
            await obsClient.call('SetSceneItemEnabled', {
              sceneName: action.sceneName,
              sceneItemId: action.sceneItemId,
              sceneItemEnabled: !action.sceneItemEnabled
            });
            logger.info(`[Rollback] Toggled scene item: ${action.sceneItemId}`);
          } catch (error) {
            logger.warn(`[Rollback] Failed to toggle scene item:`, error);
          }
        };

      case 'StartStream':
        return async () => {
          try {
            await obsClient.call('StopStream');
            logger.info(`[Rollback] Stopped stream`);
          } catch (error) {
            logger.warn(`[Rollback] Failed to stop stream:`, error);
          }
        };

      case 'StopStream':
        // Can't really rollback stopping a stream
        return null;

      case 'StartRecord':
        return async () => {
          try {
            await obsClient.call('StopRecord');
            logger.info(`[Rollback] Stopped recording`);
          } catch (error) {
            logger.warn(`[Rollback] Failed to stop recording:`, error);
          }
        };

      default:
        // No rollback for unknown actions
        return null;
    }
  }

  /**
   * Execute rollback actions in reverse order
   */
  private async rollback(context: ActionContext): Promise<void> {
    if (context.rollbackStack.length === 0) {
      logger.info('[ActionExecutor] No rollback actions to execute');
      return;
    }

    logger.warn(`[ActionExecutor] Rolling back ${context.rollbackStack.length} actions...`);

    // Execute in reverse order
    for (const rollbackAction of context.rollbackStack.reverse()) {
      try {
        await rollbackAction();
        await this.delay(this.ACTION_DELAY_MS);
      } catch (error) {
        logger.error('[ActionExecutor] Rollback action failed:', error);
        // Continue with other rollbacks even if one fails
      }
    }

    logger.info('[ActionExecutor] Rollback completed');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const obsActionExecutor = new ObsActionExecutor();
