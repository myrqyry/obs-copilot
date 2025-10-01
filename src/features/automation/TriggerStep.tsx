import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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
        <div className="space-y-6">
            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                    Rule Name
                </label>
                <Input
                    value={ruleName}
                    onChange={(e) => setRuleName(e.target.value)}
                    placeholder="Enter a descriptive name for this rule"
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                    Trigger Event
                </label>
                <Select value={trigger.eventName} onValueChange={(value) => setTrigger({ ...trigger, eventName: value, eventData: {} })}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select an event..." />
                    </SelectTrigger>
                    <SelectContent>
                        {OBS_EVENT_LIST.map(event => (
                            <SelectItem key={event.name} value={event.name}>
                                {event.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {trigger.eventName && (
                    <p className="text-sm text-muted-foreground">
                        {OBS_EVENT_LIST.find(e => e.name === trigger.eventName)?.description}
                    </p>
                )}
            </div>

            {trigger.eventName && EVENT_DATA_CONFIGS[trigger.eventName] && (
                <div className="space-y-4">
                    <label className="text-sm font-medium text-foreground">
                        Event Data Filters (Optional)
                    </label>
                    {EVENT_DATA_CONFIGS[trigger.eventName].map(field => (
                        <div key={field.name} className="space-y-2">
                            <label className="text-xs text-muted-foreground">
                                {field.description || field.name}
                            </label>
                            {field.type === 'select' ? (
                                <Select value={String(trigger.eventData?.[field.name] || '')} onValueChange={(value) => setTrigger({
                                    ...trigger,
                                    eventData: { ...trigger.eventData, [field.name]: value }
                                })}>
                                    <SelectTrigger className="text-sm">
                                        <SelectValue placeholder={`Any ${field.name}`} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {field.options?.map(option => (
                                            <SelectItem key={option} value={option}>
                                                {option}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Input
                                    value={String(trigger.eventData?.[field.name] || '')}
                                    onChange={(e) => setTrigger({
                                        ...trigger,
                                        eventData: { ...trigger.eventData, [field.name]: e.target.value }
                                    })}
                                    placeholder={`Enter ${field.name}`}
                                    className="text-sm"
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}

            <div className="flex items-center space-x-2">
                <Switch
                    id="enabled"
                    checked={enabled}
                    onCheckedChange={setEnabled}
                />
                <label htmlFor="enabled" className="text-sm text-foreground">
                    Enable this rule
                </label>
            </div>
        </div>
    );
};
