import React from 'react';
import { TextInput } from '@/components/common/TextInput';
import { OBS_EVENT_LIST } from '@/constants/obsEvents';
import { EVENT_DATA_CONFIGS, AutomationTrigger } from '@/types/automation';

interface TriggerStepProps {
    ruleName: string;
    setRuleName: (name: string) => void;
    trigger: AutomationTrigger;
    setTrigger: (trigger: AutomationTrigger) => void;
    enabled: boolean;
    setEnabled: (enabled: boolean) => void;
}

export const TriggerStep: React.FC<TriggerStepProps> = ({
    ruleName,
    setRuleName,
    trigger,
    setTrigger,
    enabled,
    setEnabled,
}) => {
    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                    Rule Name
                </label>
                <TextInput
                    value={ruleName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRuleName(e.target.value)}
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
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTrigger({ ...trigger, eventName: e.target.value, eventData: {} })}
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
                                    value={String(trigger.eventData?.[field.name] || '')}
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTrigger({
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
                            ) : (
                                <TextInput
                                    value={String(trigger.eventData?.[field.name] || '')}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTrigger({
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEnabled(e.target.checked)}
                    className="accent-accent"
                />
                <label htmlFor="enabled" className="text-sm text-foreground">
                    Enable this rule
                </label>
            </div>
        </div>
    );
};
