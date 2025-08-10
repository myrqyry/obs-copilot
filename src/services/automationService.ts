// src/services/automationService.ts
import type {
  AutomationRule,
  AutomationCondition,
  AutomationAction,
  StreamerBotActionData,
} from '../types/automation';
import type { ObsAction } from '../types/obsActions';
import { throttle } from 'lodash';
import type { StreamerBotService } from './streamerBotService';
import { logger } from '../utils/logger';

import { OBSData } from '../types';

export class AutomationService {
  private rules: AutomationRule[] = [];
  private isInitialized = false;
  private obsData: Partial<OBSData> = {};
  private streamerBotService: StreamerBotService | null = null;
  private handleObsAction:
    | ((action: ObsAction) => Promise<{ success: boolean; message: string; error?: string }>)
    | null = null;
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // Delay in ms between retries
  private addMessage:
    | ((message: { role: 'user' | 'model' | 'system'; text: string }) => void)
    | null = null;

  constructor() {}

  /**
   * Initialize the automation service with rules and required services
   */
  initialize(
    rules: AutomationRule[],
    streamerBotService: StreamerBotService | null,
    handleObsAction: (
      action: ObsAction,
    ) => Promise<{ success: boolean; message: string; error?: string }>,
    addMessage: (message: { role: 'user' | 'model' | 'system'; text: string }) => void,
  ) {
    this.rules = rules;
    this.streamerBotService = streamerBotService;
    this.handleObsAction = handleObsAction;
    this.addMessage = addMessage;
    this.isInitialized = true;
    logger.info(`AutomationService initialized with ${rules.length} rules`);
  }

  /**
   * Update the rules and current OBS data
   */
  updateRules(rules: AutomationRule[]) {
    this.rules = rules;
  }

  /**
   * Update current OBS data for condition evaluation
   */
  updateObsData(obsData: Partial<OBSData>) {
    this.obsData = obsData;
  }

  /**
   * Process an OBS event and execute matching automation rules
   */
  private throttledProcessEvent = throttle(
    async (eventName: string, eventData: Record<string, unknown>): Promise<void> => {
      if (!this.isInitialized) {
        logger.warn('AutomationService not initialized, skipping event processing');
        return;
      }
      if (!this.checkServiceAvailability()) {
        logger.error('Required services are unavailable. Skipping event processing.');
        this.addMessage?.({
          role: 'system',
          text: `❌ **Service Unavailable**\n\nRequired services are unavailable. Please check your OBS or Streamer.bot connection.`,
        });
        return;
      }

      // Find all enabled rules that match this event
      const matchingRules = this.rules.filter(
        (rule) => rule.enabled && rule.trigger.eventName === eventName,
      );

      if (matchingRules.length === 0) {
        return;
      }

      logger.info(`Processing event ${eventName} with ${matchingRules.length} matching rules`);

      // Process each matching rule
      for (const rule of matchingRules) {
        try {
          // Check if trigger data matches (if specified)
          if (!this.evaluateTriggerData(rule, eventData)) {
            continue;
          }

          // Check if conditions are met (if any)
          if (rule.conditions && rule.conditions.length > 0) {
            if (!this.evaluateConditions(rule.conditions, eventData)) {
              continue;
            }
          }

          // Execute the rule
          await this.executeRule(rule);
        } catch (error) {
          logger.error(`Error processing rule "${rule.name}":`, error);
          this.addMessage?.({
            role: 'system',
            text: `❌ **Automation Rule Error**\n\nRule "${rule.name}" failed to execute: ${(error as Error).message}`,
          });
        }
      }
    },
    500,
  ); // Throttle to process events at most once every 500ms

  async processEvent(eventName: string, eventData: Record<string, unknown>): Promise<void> {
    await this.throttledProcessEvent(eventName, eventData);
  }

  /**
   * Evaluate if trigger data matches the rule's trigger requirements
   */
  private evaluateTriggerData(rule: AutomationRule, eventData: Record<string, unknown>): boolean {
    if (!rule.trigger.eventData) {
      return true; // No specific trigger data required
    }

    // Check each required trigger data field
    for (const [key, expectedValue] of Object.entries(rule.trigger.eventData)) {
      const actualValue = eventData[key];

      // If the expected value is empty/null, skip this check
      if (expectedValue === '' || expectedValue === null || expectedValue === undefined) {
        continue;
      }

      if (actualValue !== expectedValue) {
        logger.debug(
          `Trigger data mismatch for rule "${rule.name}": ${key} = ${actualValue}, expected ${expectedValue}`,
        );
        return false;
      }
    }

    return true;
  }

  /**
   * Evaluate all conditions for a rule
   */
  private evaluateConditions(
    conditions: AutomationCondition[],
    eventData: Record<string, unknown>,
  ): boolean {
    return conditions.every((condition) => this.evaluateCondition(condition, eventData));
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(
    condition: AutomationCondition,
    eventData: Record<string, unknown>,
  ): boolean {
    let actualValue: unknown;

    // Get the actual value based on condition type and field
    switch (condition.type) {
      case 'scene':
        actualValue = this.getSceneValue(condition.field);
        break;
      case 'source':
        actualValue = this.getSourceValue(condition.field, eventData);
        break;
      case 'stream':
        actualValue = this.getStreamValue(condition.field);
        break;
      case 'custom':
        actualValue = eventData[condition.field];
        break;
      default:
        logger.warn(`Unknown condition type: ${condition.type}`);
        return false;
    }

    // Apply the operator
    return this.applyOperator(actualValue, condition.operator, condition.value);
  }

  /**
   * Get scene-related values
   */
  private getSceneValue(field: string): string | null | undefined {
    switch (field) {
      case 'currentProgramScene':
        return this.obsData.currentProgramScene;
      case 'currentPreviewScene':
        // OBSData doesn't have currentPreviewScene, return null for now
        // This would need to be added to OBSData type if preview scene tracking is needed
        return null;
      default:
        return null;
    }
  }

  /**
   * Get source-related values
   */
  private getSourceValue(
    field: string,
    eventData: Record<string, unknown>,
  ): string | boolean | null {
    switch (field) {
      case 'inputMuted':
        // For source conditions, we often need to check against the event data
        return eventData.inputMuted as boolean;
      case 'inputActive':
        return eventData.inputActive as boolean;
      case 'inputName':
        return eventData.inputName as string;
      default:
        return null;
    }
  }

  /**
   * Get stream-related values
   */
  private getStreamValue(field: string): boolean | null {
    switch (field) {
      case 'streamActive':
        return this.obsData.streamStatus?.outputActive || false;
      case 'recordActive':
        return this.obsData.recordStatus?.outputActive || false;
      default:
        return null;
    }
  }

  /**
   * Apply comparison operator
   */
  private applyOperator(actualValue: unknown, operator: string, expectedValue: unknown): boolean {
    switch (operator) {
      case 'equals':
        return actualValue === expectedValue;
      case 'not_equals':
        return actualValue !== expectedValue;
      case 'contains':
        return String(actualValue).toLowerCase().includes(String(expectedValue).toLowerCase());
      case 'greater_than':
        return Number(actualValue) > Number(expectedValue);
      case 'less_than':
        return Number(actualValue) < Number(expectedValue);
      default:
        logger.warn(`Unknown operator: ${operator}`);
        return false;
    }
  }

  /**
   * Execute a rule's actions
   */
  private async executeRule(rule: AutomationRule): Promise<void> {
    logger.info(`Executing rule: ${rule.name}`);

    // Update rule statistics
    rule.lastTriggered = new Date();
    rule.triggerCount = (rule.triggerCount || 0) + 1;

    // Add system message about rule execution
    this.addMessage?.({
      role: 'system',
      text: `🔄 **Automation Rule Triggered**\n\n**Rule:** ${rule.name}\n**Actions:** ${rule.actions.length} action(s) will be executed`,
    });

    // Execute each action
    for (let i = 0; i < rule.actions.length; i++) {
      const action = rule.actions[i];
      try {
        await this.executeAction(action, rule.name);
      } catch (error) {
        logger.error(`Error executing action ${i + 1} of rule "${rule.name}":`, error);
        this.addMessage?.({
          role: 'system',
          text: `❌ **Action Failed**\n\nRule "${rule.name}" action ${i + 1} failed: ${(error as Error).message}`,
        });
      }
    }
  }

  /**
   * Execute a single action
   */
  private async executeAction(action: AutomationAction, ruleName: string): Promise<void> {
    let attempt = 0;
    while (attempt < this.maxRetries) {
      try {
        attempt++;
        logger.info(`Executing action (attempt ${attempt}/${this.maxRetries}):`, action);

        if (action.type === 'obs') {
          if (!this.handleObsAction) {
            throw new Error('OBS action handler not available');
          }

          // Type guard: when action.type is 'obs', action.data is ObsAction
          const obsActionData = action.data as ObsAction;
          const result = await this.handleObsAction(obsActionData);

          this.addMessage?.({
            role: 'system',
            text: `🎛️ **OBS Action (Rule: ${ruleName})**\n\n${result.message}`,
          });

          if (!result.success) {
            throw new Error(result.error || 'OBS action failed');
          }
        } else if (action.type === 'streamerbot') {
          if (!this.streamerBotService) {
            throw new Error('Streamer.bot service not available');
          }

          // Type guard: when action.type is 'streamerbot', action.data is StreamerBotActionData
          const streamerBotData = action.data as StreamerBotActionData;
          await this.streamerBotService.doAction(
            streamerBotData.actionName,
            streamerBotData.args || {},
          );

          this.addMessage?.({
            role: 'system',
            text: `🤖 **Streamer.bot Action (Rule: ${ruleName})**\n\n✅ Executed action "${streamerBotData.actionName}"`,
          });
        } else {
          throw new Error(`Unknown action type: ${action.type}`);
        }

        // Action succeeded, exit retry loop
        return;
      } catch (error) {
        logger.error(`Error executing action (attempt ${attempt}/${this.maxRetries}):`, error);

        if (attempt >= this.maxRetries) {
          this.addMessage?.({
            role: 'system',
            text: `❌ **Action Failed**\n\nRule "${ruleName}" action failed after ${this.maxRetries} attempts: ${(error as Error).message}`,
          });
          throw error; // Re-throw error after max retries
        }

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
      }
    }
  }

  private checkServiceAvailability(): boolean {
    const obsAvailable = !!this.handleObsAction;
    const streamerBotAvailable = !!this.streamerBotService;

    return obsAvailable && streamerBotAvailable;
  }

  /**
   * Get automation statistics
   */
  getStatistics(): { totalRules: number; enabledRules: number; totalTriggers: number } {
    const totalRules = this.rules.length;
    const enabledRules = this.rules.filter((rule) => rule.enabled).length;
    const totalTriggers = this.rules.reduce((sum, rule) => sum + (rule.triggerCount || 0), 0);

    return { totalRules, enabledRules, totalTriggers };
  }

  /**
   * Test a rule without actually executing it
   */
  async testRule(
    rule: AutomationRule,
    mockEventData: Record<string, unknown>,
  ): Promise<{ wouldTrigger: boolean; reason: string }> {
    try {
      if (!rule.enabled) {
        return { wouldTrigger: false, reason: 'Rule is disabled' };
      }

      if (!this.evaluateTriggerData(rule, mockEventData)) {
        return { wouldTrigger: false, reason: 'Trigger data does not match' };
      }

      if (rule.conditions && rule.conditions.length > 0) {
        if (!this.evaluateConditions(rule.conditions, mockEventData)) {
          return { wouldTrigger: false, reason: 'Conditions not met' };
        }
      }

      return { wouldTrigger: true, reason: 'All conditions met' };
    } catch (error) {
      return { wouldTrigger: false, reason: `Error: ${(error as Error).message}` };
    }
  }
}

// Singleton instance
export const automationService = new AutomationService();
