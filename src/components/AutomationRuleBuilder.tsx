// src/components/AutomationRuleBuilder.tsx
import React, { useState, useEffect } from 'react';
import { Modal } from './common/Modal';
import { Button } from './common/Button';
import { TextInput } from './common/TextInput';
/* import Tooltip from './ui/Tooltip'; */
import { useAppStore } from '../store/appStore';
import type { AutomationRule, AutomationTrigger, AutomationCondition, AutomationAction } from '../types/automation';
import { EVENT_DATA_CONFIGS, CONDITION_FIELD_OPTIONS /*, RULE_TEMPLATES */ } from '../types/automation';
import type { ObsAction } from '../types/obsActions';
import { OBS_EVENT_LIST } from '../constants/obsEvents';
import { cn } from '../lib/utils';

interface AutomationRuleBuilderProps {
    isOpen: boolean;
    onClose: () => void;
    initialEventName?: string;
    editingRule?: AutomationRule | null;
}

export const AutomationRuleBuilder: React.FC<AutomationRuleBuilderProps> = ({
    isOpen,
    onClose,
    initialEventName,
    editingRule
}) => {
    const { actions: storeActions, scenes, streamerBotServiceInstance } = useAppStore();

    // Form state
    const [ruleName, setRuleName] = useState('');
    const [enabled, setEnabled] = useState(true);
    const [trigger, setTrigger] = useState<AutomationTrigger>({
        eventName: initialEventName || '',
        eventData: {}
    });
    const [conditions, setConditions] = useState<AutomationCondition[]>([]);
    const [actions, setActions] = useState<AutomationAction[]>([]);

    // UI state
    const [currentStep, setCurrentStep] = useState<'trigger' | 'conditions' | 'actions' | 'review'>('trigger');
    const [streamerBotActions, setStreamerBotActions] = useState<any[]>([]);

    // Load Streamer.bot actions
    useEffect(() => {
        if (streamerBotServiceInstance) {
            streamerBotServiceInstance.getActions()
                .then((actionsList: any) => {
                    // Handle the response properly - it might be an array or an object with actions property
                    if (Array.isArray(actionsList)) {
                        setStreamerBotActions(actionsList);
                    } else if (actionsList && typeof actionsList === 'object' && Array.isArray(actionsList.actions)) {
                        setStreamerBotActions(actionsList.actions);
                    } else {
                        console.warn('Unexpected Streamer.bot actions format:', actionsList);
                        setStreamerBotActions([]);
                    }
                })
                .catch(err => {
                    console.warn('Failed to load Streamer.bot actions:', err);
                    setStreamerBotActions([]);
                });
        } else {
            // Clear actions when no service instance
            setStreamerBotActions([]);
        }
    }, [streamerBotServiceInstance]);

    // Initialize form when editing
    useEffect(() => {
        if (editingRule) {
            setRuleName(editingRule.name);
            setEnabled(editingRule.enabled);
            setTrigger(editingRule.trigger);
            setConditions(editingRule.conditions || []);
            setActions(editingRule.actions);
        } else if (initialEventName) {
            setTrigger(prev => ({ ...prev, eventName: initialEventName }));
        }
    }, [editingRule, initialEventName]);

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setRuleName('');
            setEnabled(true);
            setTrigger({ eventName: initialEventName || '', eventData: {} });
            setConditions([]);
            setActions([]);
            setCurrentStep('trigger');
        }
    }, [isOpen, initialEventName]);

    const handleSave = () => {
        if (!ruleName.trim()) {
            alert('Please enter a rule name');
            return;
        }

        if (!trigger.eventName) {
            alert('Please select a trigger event');
            return;
        }

        if (actions.length === 0) {
            alert('Please add at least one action');
            return;
        }

        const rule: AutomationRule = {
            id: editingRule?.id || `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: ruleName.trim(),
            enabled,
            trigger,
            conditions: conditions.length > 0 ? conditions : undefined,
            actions,
            createdAt: editingRule?.createdAt || new Date(),
            triggerCount: editingRule?.triggerCount || 0
        };

        if (editingRule) {
            storeActions.updateAutomationRule(editingRule.id, rule);
        } else {
            storeActions.addAutomationRule(rule);
        }

        onClose();
    };

    const addCondition = () => {
        const newCondition: AutomationCondition = {
            id: `condition-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'scene',
            field: 'currentProgramScene',
            operator: 'equals',
            value: ''
        };
        setConditions([...conditions, newCondition]);
    };

    const updateCondition = (id: string, updates: Partial<AutomationCondition>) => {
        setConditions(conditions.map(condition =>
            condition.id === id ? { ...condition, ...updates } : condition
        ));
    };

    const removeCondition = (id: string) => {
        setConditions(conditions.filter(condition => condition.id !== id));
    };

    const addAction = (type: 'obs' | 'streamerbot') => {
        const newAction: AutomationAction = {
            id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type,
            data: type === 'obs'
                ? { type: 'setCurrentProgramScene', sceneName: '' } as ObsAction
                : { actionName: '', args: {} }
        };
        setActions([...actions, newAction]);
    };

    const updateAction = (id: string, updates: Partial<AutomationAction>) => {
        setActions(actions.map(action =>
            action.id === id ? { ...action, ...updates } : action
        ));
    };

    const removeAction = (id: string) => {
        setActions(actions.filter(action => action.id !== id));
    };

    const renderStepIndicator = () => (
        <div className="flex items-center space-x-2 mb-6">
            {['trigger', 'conditions', 'actions', 'review'].map((step, index) => (
                <React.Fragment key={step}>
                    <button
                        onClick={() => setCurrentStep(step as any)}
                        className={cn(
                            "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors",
                            currentStep === step
                                ? "bg-accent text-accent-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                    >
                        {index + 1}
                    </button>
                    {index < 3 && (
                        <div className={cn(
                            "w-8 h-0.5 transition-colors",
                            ['trigger', 'conditions', 'actions', 'review'].indexOf(currentStep) > index
                                ? "bg-accent"
                                : "bg-muted"
                        )} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );

    const renderTriggerStep = () => (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                    Rule Name
                </label>
                <TextInput
                    value={ruleName}
                    onChange={(e) => setRuleName(e.target.value)}
                    placeholder="Enter a descriptive name for this rule"
                    className="w-full"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                    Trigger Event
                </label>
                <select
                    value={trigger.eventName}
                    onChange={(e) => setTrigger({ ...trigger, eventName: e.target.value, eventData: {} })}
                    className="w-full border rounded p-2 bg-background text-foreground"
                >
                    <option value="">Select an event...</option>
                    {OBS_EVENT_LIST.map(event => (
                        <option key={event.name} value={event.name}>
                            {event.name}
                        </option>
                    ))}
                </select>
                {trigger.eventName && (
                    <p className="text-sm text-muted-foreground mt-1">
                        {OBS_EVENT_LIST.find(e => e.name === trigger.eventName)?.description}
                    </p>
                )}
            </div>

            {trigger.eventName && EVENT_DATA_CONFIGS[trigger.eventName] && (
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Event Data Filters (Optional)
                    </label>
                    {EVENT_DATA_CONFIGS[trigger.eventName].map(field => (
                        <div key={field.name} className="mb-3">
                            <label className="block text-xs text-muted-foreground mb-1">
                                {field.description || field.name}
                            </label>
                            {field.type === 'select' ? (
                                <select
                                    value={trigger.eventData?.[field.name] || ''}
                                    onChange={(e) => setTrigger({
                                        ...trigger,
                                        eventData: { ...trigger.eventData, [field.name]: e.target.value }
                                    })}
                                    className="w-full border rounded p-2 bg-background text-foreground text-sm"
                                >
                                    <option value="">Any {field.name}</option>
                                    {field.options?.map(option => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            ) : field.type === 'boolean' ? (
                                <select
                                    value={trigger.eventData?.[field.name] || ''}
                                    onChange={(e) => setTrigger({
                                        ...trigger,
                                        eventData: { ...trigger.eventData, [field.name]: e.target.value === 'true' }
                                    })}
                                    className="w-full border rounded p-2 bg-background text-foreground text-sm"
                                >
                                    <option value="">Any</option>
                                    <option value="true">True</option>
                                    <option value="false">False</option>
                                </select>
                            ) : (
                                <TextInput
                                    value={trigger.eventData?.[field.name] || ''}
                                    onChange={(e) => setTrigger({
                                        ...trigger,
                                        eventData: { ...trigger.eventData, [field.name]: e.target.value }
                                    })}
                                    placeholder={`Enter ${field.name}`}
                                    className="w-full text-sm"
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}

            <div className="flex items-center space-x-2">
                <input
                    type="checkbox"
                    id="enabled"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    className="accent-accent"
                />
                <label htmlFor="enabled" className="text-sm text-foreground">
                    Enable this rule
                </label>
            </div>
        </div>
    );

    const renderConditionsStep = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-foreground">Conditions (Optional)</h3>
                <Button onClick={addCondition} size="sm">
                    Add Condition
                </Button>
            </div>

            <p className="text-sm text-muted-foreground">
                Add conditions that must be met for the rule to execute. All conditions must be true.
            </p>

            {conditions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    <p>No conditions added. Rule will trigger for any matching event.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {conditions.map((condition, index) => (
                        <div key={condition.id} className="border rounded p-3 bg-muted/20">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-foreground">
                                    Condition {index + 1}
                                </span>
                                <Button
                                    onClick={() => removeCondition(condition.id)}
                                    variant="danger"
                                    size="sm"
                                >
                                    Remove
                                </Button>
                            </div>

                            {/* Condition builder UI will be implemented here */}
                            <div className="grid grid-cols-4 gap-2">
                                <select
                                    value={condition.type}
                                    onChange={(e) => updateCondition(condition.id, {
                                        type: e.target.value as any,
                                        field: CONDITION_FIELD_OPTIONS[e.target.value]?.[0]?.field || ''
                                    })}
                                    className="border rounded p-1 bg-background text-foreground text-sm"
                                >
                                    <option value="scene">Scene</option>
                                    <option value="source">Source</option>
                                    <option value="stream">Stream</option>
                                    <option value="custom">Custom</option>
                                </select>

                                <select
                                    value={condition.field}
                                    onChange={(e) => updateCondition(condition.id, { field: e.target.value })}
                                    className="border rounded p-1 bg-background text-foreground text-sm"
                                >
                                    {CONDITION_FIELD_OPTIONS[condition.type]?.map(option => (
                                        <option key={option.field} value={option.field}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={condition.operator}
                                    onChange={(e) => updateCondition(condition.id, { operator: e.target.value as any })}
                                    className="border rounded p-1 bg-background text-foreground text-sm"
                                >
                                    <option value="equals">Equals</option>
                                    <option value="not_equals">Not Equals</option>
                                    <option value="contains">Contains</option>
                                    <option value="greater_than">Greater Than</option>
                                    <option value="less_than">Less Than</option>
                                </select>

                                <TextInput
                                    value={condition.value}
                                    onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                                    placeholder="Value"
                                    className="text-sm"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderActionsStep = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-foreground">Actions</h3>
                <div className="space-x-2">
                    <Button onClick={() => addAction('obs')} size="sm">
                        Add OBS Action
                    </Button>
                    <Button onClick={() => addAction('streamerbot')} size="sm" variant="secondary">
                        Add Streamer.bot Action
                    </Button>
                </div>
            </div>

            <p className="text-sm text-muted-foreground">
                Define what should happen when this rule is triggered.
            </p>

            {actions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    <p>No actions added. Add at least one action for the rule to do something.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {actions.map((action, index) => (
                        <div key={action.id} className="border rounded p-3 bg-muted/20">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-foreground">
                                    {action.type === 'obs' ? '🎛️ OBS' : '🤖 Streamer.bot'} Action {index + 1}
                                </span>
                                <Button
                                    onClick={() => removeAction(action.id)}
                                    variant="danger"
                                    size="sm"
                                >
                                    Remove
                                </Button>
                            </div>

                            {action.type === 'obs' ? (
                                <div className="space-y-2">
                                    <select
                                        value={(action.data as ObsAction).type}
                                        onChange={(e) => updateAction(action.id, {
                                            data: { type: e.target.value } as ObsAction
                                        })}
                                        className="w-full border rounded p-2 bg-background text-foreground text-sm"
                                    >
                                        <option value="">Select OBS Action...</option>
                                        <option value="setCurrentProgramScene">Switch Scene</option>
                                        <option value="setSceneItemEnabled">Enable/Disable Source</option>
                                        <option value="setInputMute">Mute/Unmute Input</option>
                                        <option value="setInputVolume">Set Input Volume</option>
                                        <option value="toggleStream">Toggle Stream</option>
                                        <option value="toggleRecord">Toggle Recording</option>
                                        <option value="startStream">Start Stream</option>
                                        <option value="stopStream">Stop Stream</option>
                                        <option value="startRecord">Start Recording</option>
                                        <option value="stopRecord">Stop Recording</option>
                                    </select>

                                    {/* Dynamic action parameter inputs based on selected action type */}
                                    {(action.data as ObsAction).type === 'setCurrentProgramScene' && (
                                        <select
                                            value={(action.data as any).sceneName || ''}
                                            onChange={(e) => updateAction(action.id, {
                                                data: { type: 'setCurrentProgramScene', sceneName: e.target.value }
                                            })}
                                            className="w-full border rounded p-2 bg-background text-foreground text-sm"
                                        >
                                            <option value="">Select Scene...</option>
                                            {scenes.map(scene => (
                                                <option key={scene.sceneName} value={scene.sceneName}>
                                                    {scene.sceneName}
                                                </option>
                                            ))}
                                        </select>
                                    )}

                                    {(action.data as ObsAction).type === 'setSceneItemEnabled' && (
                                        <>
                                            <select
                                                value={(action.data as any).sceneName || ''}
                                                onChange={(e) => {
                                                    const currentData = action.data as any;
                                                    updateAction(action.id, {
                                                        data: {
                                                            type: 'setSceneItemEnabled',
                                                            sceneName: e.target.value,
                                                            sourceName: currentData.sourceName || '',
                                                            sceneItemEnabled: currentData.sceneItemEnabled ?? true
                                                        }
                                                    });
                                                }}
                                                className="w-full border rounded p-2 bg-background text-foreground text-sm"
                                            >
                                                <option value="">Select Scene...</option>
                                                {scenes.map(scene => (
                                                    <option key={scene.sceneName} value={scene.sceneName}>
                                                        {scene.sceneName}
                                                    </option>
                                                ))}
                                            </select>
                                            <TextInput
                                                value={(action.data as any).sourceName || ''}
                                                onChange={(e) => {
                                                    const currentData = action.data as any;
                                                    updateAction(action.id, {
                                                        data: {
                                                            type: 'setSceneItemEnabled',
                                                            sceneName: currentData.sceneName || '',
                                                            sourceName: e.target.value,
                                                            sceneItemEnabled: currentData.sceneItemEnabled ?? true
                                                        }
                                                    });
                                                }}
                                                placeholder="Source Name"
                                                className="w-full text-sm"
                                            />
                                            <select
                                                value={(action.data as any).sceneItemEnabled?.toString() || 'true'}
                                                onChange={(e) => {
                                                    const currentData = action.data as any;
                                                    updateAction(action.id, {
                                                        data: {
                                                            type: 'setSceneItemEnabled',
                                                            sceneName: currentData.sceneName || '',
                                                            sourceName: currentData.sourceName || '',
                                                            sceneItemEnabled: e.target.value === 'true'
                                                        }
                                                    });
                                                }}
                                                className="w-full border rounded p-2 bg-background text-foreground text-sm"
                                            >
                                                <option value="true">Enable</option>
                                                <option value="false">Disable</option>
                                            </select>
                                        </>
                                    )}

                                    {(action.data as ObsAction).type === 'setInputMute' && (
                                        <>
                                            <TextInput
                                                value={(action.data as any).inputName || ''}
                                                onChange={(e) => updateAction(action.id, {
                                                    data: {
                                                        type: 'setInputMute',
                                                        inputName: e.target.value,
                                                        inputMuted: (action.data as any).inputMuted ?? true
                                                    }
                                                })}
                                                placeholder="Input Name"
                                                className="w-full text-sm"
                                            />
                                            <select
                                                value={(action.data as any).inputMuted?.toString() || 'true'}
                                                onChange={(e) => updateAction(action.id, {
                                                    data: {
                                                        type: 'setInputMute',
                                                        inputName: (action.data as any).inputName || '',
                                                        inputMuted: e.target.value === 'true'
                                                    }
                                                })}
                                                className="w-full border rounded p-2 bg-background text-foreground text-sm"
                                            >
                                                <option value="true">Mute</option>
                                                <option value="false">Unmute</option>
                                            </select>
                                        </>
                                    )}

                                    {(action.data as ObsAction).type === 'setInputVolume' && (
                                        <>
                                            <TextInput
                                                value={(action.data as any).inputName || ''}
                                                onChange={(e) => updateAction(action.id, {
                                                    data: {
                                                        type: 'setInputVolume',
                                                        inputName: e.target.value,
                                                        inputVolumeMul: (action.data as any).inputVolumeMul || 1.0
                                                    }
                                                })}
                                                placeholder="Input Name"
                                                className="w-full text-sm"
                                            />
                                            <TextInput
                                                type="number"
                                                value={(action.data as any).inputVolumeMul || ''}
                                                onChange={(e) => updateAction(action.id, {
                                                    data: {
                                                        type: 'setInputVolume',
                                                        inputName: (action.data as any).inputName || '',
                                                        inputVolumeMul: parseFloat(e.target.value) || 1.0
                                                    }
                                                })}
                                                placeholder="Volume (0.0 to 1.0)"
                                                className="w-full text-sm"
                                                step="0.1"
                                                min="0"
                                                max="1"
                                            />
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <select
                                        value={(action.data as any).actionName || ''}
                                        onChange={(e) => updateAction(action.id, {
                                            data: { actionName: e.target.value, args: {} }
                                        })}
                                        className="w-full border rounded p-2 bg-background text-foreground text-sm"
                                    >
                                        <option value="">Select Streamer.bot Action...</option>
                                        {streamerBotActions.map(sbAction => (
                                            <option key={sbAction.id} value={sbAction.name}>
                                                {sbAction.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderReviewStep = () => (
        <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">Review Rule</h3>

            <div className="bg-muted/20 rounded p-4 space-y-3">
                <div>
                    <span className="text-sm font-medium text-foreground">Rule Name:</span>
                    <p className="text-sm text-muted-foreground">{ruleName || 'Unnamed Rule'}</p>
                </div>

                <div>
                    <span className="text-sm font-medium text-foreground">Status:</span>
                    <p className="text-sm text-muted-foreground">{enabled ? 'Enabled' : 'Disabled'}</p>
                </div>

                <div>
                    <span className="text-sm font-medium text-foreground">Trigger:</span>
                    <p className="text-sm text-muted-foreground">
                        When "{trigger.eventName}" occurs
                        {Object.keys(trigger.eventData || {}).length > 0 && (
                            <span> with specific data filters</span>
                        )}
                    </p>
                </div>

                {conditions.length > 0 && (
                    <div>
                        <span className="text-sm font-medium text-foreground">Conditions:</span>
                        <ul className="text-sm text-muted-foreground ml-4">
                            {conditions.map((condition) => (
                                <li key={condition.id}>
                                    {condition.field} {condition.operator} "{condition.value}"
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div>
                    <span className="text-sm font-medium text-foreground">Actions:</span>
                    <ul className="text-sm text-muted-foreground ml-4">
                        {actions.map((action) => (
                            <li key={action.id}>
                                {action.type === 'obs' ? 'OBS' : 'Streamer.bot'}: {
                                    action.type === 'obs'
                                        ? (action.data as ObsAction).type
                                        : (action.data as any).actionName
                                }
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 'trigger':
                return renderTriggerStep();
            case 'conditions':
                return renderConditionsStep();
            case 'actions':
                return renderActionsStep();
            case 'review':
                return renderReviewStep();
            default:
                return null;
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editingRule ? 'Edit Automation Rule' : 'Create Automation Rule'}
            size="xl"
        >
            <div className="space-y-6">
                {renderStepIndicator()}

                <div className="min-h-[400px]">
                    {renderCurrentStep()}
                </div>

                <div className="flex justify-between pt-4 border-t border-border">
                    <div className="space-x-2">
                        {currentStep !== 'trigger' && (
                            <Button
                                onClick={() => {
                                    const steps = ['trigger', 'conditions', 'actions', 'review'];
                                    const currentIndex = steps.indexOf(currentStep);
                                    setCurrentStep(steps[currentIndex - 1] as any);
                                }}
                                variant="secondary"
                            >
                                Previous
                            </Button>
                        )}
                    </div>

                    <div className="space-x-2">
                        <Button onClick={onClose} variant="secondary">
                            Cancel
                        </Button>

                        {currentStep !== 'review' ? (
                            <Button
                                onClick={() => {
                                    const steps = ['trigger', 'conditions', 'actions', 'review'];
                                    const currentIndex = steps.indexOf(currentStep);
                                    setCurrentStep(steps[currentIndex + 1] as any);
                                }}
                            >
                                Next
                            </Button>
                        ) : (
                            <Button onClick={handleSave}>
                                {editingRule ? 'Update Rule' : 'Create Rule'}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default AutomationRuleBuilder;
