import type { AutomationRule } from '../types/automation';
import type { ObsAction } from '../types/obsActions';
import type { StreamerBotService } from './streamerBotService';
export declare class AutomationService {
    private rules;
    private isInitialized;
    private obsData;
    private streamerBotService;
    private handleObsAction;
    private maxRetries;
    private retryDelay;
    private addMessage;
    constructor();
    /**
     * Initialize the automation service with rules and required services
     */
    initialize(rules: AutomationRule[], streamerBotService: StreamerBotService | null, handleObsAction: (action: ObsAction) => Promise<{
        success: boolean;
        message: string;
        error?: string;
    }>, addMessage: (message: {
        role: 'user' | 'model' | 'system';
        text: string;
    }) => void): void;
    /**
     * Update the rules and current OBS data
     */
    updateRules(rules: AutomationRule[]): void;
    /**
     * Update current OBS data for condition evaluation
     */
    updateObsData(obsData: any): void;
    /**
     * Process an OBS event and execute matching automation rules
     */
    private throttledProcessEvent;
    processEvent(eventName: string, eventData: any): Promise<void>;
    /**
     * Evaluate if trigger data matches the rule's trigger requirements
     */
    private evaluateTriggerData;
    /**
     * Evaluate all conditions for a rule
     */
    private evaluateConditions;
    /**
     * Evaluate a single condition
     */
    private evaluateCondition;
    /**
     * Get scene-related values
     */
    private getSceneValue;
    /**
     * Get source-related values
     */
    private getSourceValue;
    /**
     * Get stream-related values
     */
    private getStreamValue;
    /**
     * Apply comparison operator
     */
    private applyOperator;
    /**
     * Execute a rule's actions
     */
    private executeRule;
    /**
     * Execute a single action
     */
    private executeAction;
    private checkServiceAvailability;
    /**
     * Get automation statistics
     */
    getStatistics(): {
        totalRules: number;
        enabledRules: number;
        totalTriggers: number;
    };
    /**
     * Test a rule without actually executing it
     */
    testRule(rule: AutomationRule, mockEventData: any): Promise<{
        wouldTrigger: boolean;
        reason: string;
    }>;
}
export declare const automationService: AutomationService;
