import React from 'react';
import { AutomationRule } from '@/shared/types/automation';
import { ObsAction } from '@/shared/types/obsActions';

interface ReviewStepProps {
    rule: AutomationRule;
}

function hasActionName(data: unknown): data is { actionName: string } {
    return (
        typeof data === 'object' &&
        data !== null &&
        'actionName' in data &&
        typeof (data as any).actionName === 'string'
    );
}

export const ReviewStep: React.FC<ReviewStepProps> = ({ rule }) => {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">Review Rule</h3>

            <div className="bg-muted/20 rounded p-4 space-y-3">
                <div>
                    <span className="text-sm font-medium text-foreground">Rule Name:</span>
                    <p className="text-sm text-muted-foreground">{rule.name || 'Unnamed Rule'}</p>
                </div>

                <div>
                    <span className="text-sm font-medium text-foreground">Status:</span>
                    <p className="text-sm text-muted-foreground">{rule.enabled ? 'Enabled' : 'Disabled'}</p>
                </div>

                <div>
                    <span className="text-sm font-medium text-foreground">Trigger:</span>
                    <p className="text-sm text-muted-foreground">
                        When "{rule.trigger.eventName}" occurs
                        {Object.keys(rule.trigger.eventData || {}).length > 0 && (
                            <span> with specific data filters</span>
                        )}
                    </p>
                </div>

                {rule.conditions && rule.conditions.length > 0 && (
                    <div>
                        <span className="text-sm font-medium text-foreground">Conditions:</span>
                        <ul className="text-sm text-muted-foreground ml-4">
                            {rule.conditions.map((condition) => (
                                <li key={condition.id}>
                                    {condition.field} {condition.operator} "{String(condition.value)}"
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div>
                    <span className="text-sm font-medium text-foreground">Actions:</span>
                    <ul className="text-sm text-muted-foreground ml-4">
                        {rule.actions.map((action) => (
                            <li key={action.id}>
                                {action.type === 'obs' ? 'OBS' : 'Streamer.bot'}: {
                                    action.type === 'obs'
                                        ? (action.data as ObsAction).type
                                        : hasActionName(action.data)
                                            ? action.data.actionName
                                            : 'Unknown Action'
                                }
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};
