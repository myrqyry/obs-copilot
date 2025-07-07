import { throttle } from 'lodash';
export class AutomationService {
    rules = [];
    isInitialized = false;
    obsData = {};
    streamerBotService = null;
    handleObsAction = null;
    maxRetries = 3;
    retryDelay = 1000; // Delay in ms between retries
    addMessage = null;
    constructor() { }
    /**
     * Initialize the automation service with rules and required services
     */
    initialize(rules, streamerBotService, handleObsAction, addMessage) {
        this.rules = rules;
        this.streamerBotService = streamerBotService;
        this.handleObsAction = handleObsAction;
        this.addMessage = addMessage;
        this.isInitialized = true;
        console.log(`AutomationService initialized with ${rules.length} rules`);
    }
    /**
     * Update the rules and current OBS data
     */
    updateRules(rules) {
        this.rules = rules;
    }
    /**
     * Update current OBS data for condition evaluation
     */
    updateObsData(obsData) {
        this.obsData = obsData;
    }
    /**
     * Process an OBS event and execute matching automation rules
     */
    throttledProcessEvent = throttle(async (eventName, eventData) => {
        if (!this.isInitialized) {
            console.warn('AutomationService not initialized, skipping event processing');
            return;
        }
        if (!this.checkServiceAvailability()) {
            console.error('Required services are unavailable. Skipping event processing.');
            this.addMessage?.({
                role: 'system',
                text: `❌ **Service Unavailable**\n\nRequired services are unavailable. Please check your OBS or Streamer.bot connection.`
            });
            return;
        }
        // Find all enabled rules that match this event
        const matchingRules = this.rules.filter(rule => rule.enabled && rule.trigger.eventName === eventName);
        if (matchingRules.length === 0) {
            return;
        }
        console.log(`Processing event ${eventName} with ${matchingRules.length} matching rules`);
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
            }
            catch (error) {
                console.error(`Error processing rule "${rule.name}":`, error);
                this.addMessage?.({
                    role: 'system',
                    text: `❌ **Automation Rule Error**\n\nRule "${rule.name}" failed to execute: ${error.message}`
                });
            }
        }
    }, 500); // Throttle to process events at most once every 500ms
    async processEvent(eventName, eventData) {
        await this.throttledProcessEvent(eventName, eventData);
    }
    /**
     * Evaluate if trigger data matches the rule's trigger requirements
     */
    evaluateTriggerData(rule, eventData) {
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
                console.log(`Trigger data mismatch for rule "${rule.name}": ${key} = ${actualValue}, expected ${expectedValue}`);
                return false;
            }
        }
        return true;
    }
    /**
     * Evaluate all conditions for a rule
     */
    evaluateConditions(conditions, eventData) {
        return conditions.every(condition => this.evaluateCondition(condition, eventData));
    }
    /**
     * Evaluate a single condition
     */
    evaluateCondition(condition, eventData) {
        let actualValue;
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
                console.warn(`Unknown condition type: ${condition.type}`);
                return false;
        }
        // Apply the operator
        return this.applyOperator(actualValue, condition.operator, condition.value);
    }
    /**
     * Get scene-related values
     */
    getSceneValue(field) {
        switch (field) {
            case 'currentProgramScene':
                return this.obsData.currentProgramScene;
            case 'currentPreviewScene':
                return this.obsData.currentPreviewScene;
            default:
                return null;
        }
    }
    /**
     * Get source-related values
     */
    getSourceValue(field, eventData) {
        switch (field) {
            case 'inputMuted':
                // For source conditions, we often need to check against the event data
                return eventData.inputMuted;
            case 'inputActive':
                return eventData.inputActive;
            case 'inputName':
                return eventData.inputName;
            default:
                return null;
        }
    }
    /**
     * Get stream-related values
     */
    getStreamValue(field) {
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
    applyOperator(actualValue, operator, expectedValue) {
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
                console.warn(`Unknown operator: ${operator}`);
                return false;
        }
    }
    /**
     * Execute a rule's actions
     */
    async executeRule(rule) {
        console.log(`Executing rule: ${rule.name}`);
        // Update rule statistics
        rule.lastTriggered = new Date();
        rule.triggerCount = (rule.triggerCount || 0) + 1;
        // Add system message about rule execution
        this.addMessage?.({
            role: 'system',
            text: `🔄 **Automation Rule Triggered**\n\n**Rule:** ${rule.name}\n**Actions:** ${rule.actions.length} action(s) will be executed`
        });
        // Execute each action
        for (let i = 0; i < rule.actions.length; i++) {
            const action = rule.actions[i];
            try {
                await this.executeAction(action, rule.name);
            }
            catch (error) {
                console.error(`Error executing action ${i + 1} of rule "${rule.name}":`, error);
                this.addMessage?.({
                    role: 'system',
                    text: `❌ **Action Failed**\n\nRule "${rule.name}" action ${i + 1} failed: ${error.message}`
                });
            }
        }
    }
    /**
     * Execute a single action
     */
    async executeAction(action, ruleName) {
        let attempt = 0;
        while (attempt < this.maxRetries) {
            try {
                attempt++;
                console.log(`Executing action (attempt ${attempt}/${this.maxRetries}):`, action);
                if (action.type === 'obs') {
                    if (!this.handleObsAction) {
                        throw new Error('OBS action handler not available');
                    }
                    const result = await this.handleObsAction(action.data);
                    this.addMessage?.({
                        role: 'system',
                        text: `🎛️ **OBS Action (Rule: ${ruleName})**\n\n${result.message}`
                    });
                    if (!result.success) {
                        throw new Error(result.error || 'OBS action failed');
                    }
                }
                else if (action.type === 'streamerbot') {
                    if (!this.streamerBotService) {
                        throw new Error('Streamer.bot service not available');
                    }
                    await this.streamerBotService.doAction(action.data.actionName, action.data.args || {});
                    this.addMessage?.({
                        role: 'system',
                        text: `🤖 **Streamer.bot Action (Rule: ${ruleName})**\n\n✅ Executed action "${action.data.actionName}"`
                    });
                }
                else {
                    throw new Error(`Unknown action type: ${action.type}`);
                }
                // Action succeeded, exit retry loop
                return;
            }
            catch (error) {
                console.error(`Error executing action (attempt ${attempt}/${this.maxRetries}):`, error);
                if (attempt >= this.maxRetries) {
                    this.addMessage?.({
                        role: 'system',
                        text: `❌ **Action Failed**\n\nRule "${ruleName}" action failed after ${this.maxRetries} attempts: ${error.message}`
                    });
                    throw error; // Re-throw error after max retries
                }
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, this.retryDelay));
            }
        }
    }
    checkServiceAvailability() {
        const obsAvailable = !!this.handleObsAction;
        const streamerBotAvailable = !!this.streamerBotService;
        return obsAvailable && streamerBotAvailable;
    }
    // This block was duplicated and misplaced. Removing it to fix errors.
    // Removed duplicate and misplaced block.
    // Removed duplicate and misplaced block.
    /**
     * Get automation statistics
     */
    getStatistics() {
        const totalRules = this.rules.length;
        const enabledRules = this.rules.filter(rule => rule.enabled).length;
        const totalTriggers = this.rules.reduce((sum, rule) => sum + (rule.triggerCount || 0), 0);
        return { totalRules, enabledRules, totalTriggers };
    }
    /**
     * Test a rule without actually executing it
     */
    async testRule(rule, mockEventData) {
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
        }
        catch (error) {
            return { wouldTrigger: false, reason: `Error: ${error.message}` };
        }
    }
}
// Singleton instance
export const automationService = new AutomationService();
