import type { ObsAction } from './obsActions';
export interface AutomationRule {
    id: string;
    name: string;
    enabled: boolean;
    trigger: AutomationTrigger;
    conditions?: AutomationCondition[];
    actions: AutomationAction[];
    createdAt: Date;
    lastTriggered?: Date;
    triggerCount: number;
}
export interface AutomationTrigger {
    eventName: string;
    eventData?: Record<string, any>;
}
export interface AutomationCondition {
    id: string;
    type: 'scene' | 'source' | 'stream' | 'custom';
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value: any;
    description?: string;
}
export interface AutomationAction {
    id: string;
    type: 'obs' | 'streamerbot';
    data: ObsAction | StreamerBotActionData;
    description?: string;
}
export interface StreamerBotActionData {
    actionName: string;
    args?: Record<string, any>;
}
export interface EventDataField {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'select';
    options?: string[];
    description?: string;
}
export interface ConditionFieldOption {
    field: string;
    label: string;
    type: 'string' | 'number' | 'boolean' | 'select';
    options?: string[];
    description?: string;
}
export declare const EVENT_DATA_CONFIGS: Record<string, EventDataField[]>;
export declare const CONDITION_FIELD_OPTIONS: Record<string, ConditionFieldOption[]>;
export interface RuleTemplate {
    name: string;
    description: string;
    trigger: AutomationTrigger;
    conditions?: AutomationCondition[];
    actions: Omit<AutomationAction, 'id'>[];
}
export declare const RULE_TEMPLATES: RuleTemplate[];
