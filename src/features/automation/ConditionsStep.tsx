import React from 'react';
import { CustomButton as Button } from '@/components/ui/CustomButton';
import { TextInput } from '@/components/common/TextInput';
import { AutomationCondition, CONDITION_FIELD_OPTIONS } from '@/types/automation';

interface ConditionsStepProps {
    conditions: AutomationCondition[];
    addCondition: () => void;
    updateCondition: (id: string, updates: Partial<AutomationCondition>) => void;
    removeCondition: (id: string) => void;
}

export const ConditionsStep: React.FC<ConditionsStepProps> = ({
    conditions,
    addCondition,
    updateCondition,
    removeCondition,
}) => {
    return (
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
                <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2">
                    {conditions.map((condition, index) => (
                        <div key={condition.id} className="border rounded p-3 bg-muted/20">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-foreground">
                                    Condition {index + 1}
                                </span>
                                <Button
                                    onClick={() => removeCondition(condition.id)}
                                    variant="destructive"
                                    size="sm"
                                >
                                    Remove
                                </Button>
                            </div>

                            <div className="grid grid-cols-4 gap-2">
                                <select
                                    value={condition.type || ''}
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateCondition(condition.id, {
                                        type: e.target.value as any,
                                        field: CONDITION_FIELD_OPTIONS[e.target.value as keyof typeof CONDITION_FIELD_OPTIONS]?.[0]?.field || ''
                                    })}
                                    className="border rounded p-1 bg-background text-foreground text-sm"
                                >
                                    <option value="scene">Scene</option>
                                    <option value="source">Source</option>
                                    <option value="stream">Stream</option>
                                    <option value="custom">Custom</option>
                                </select>

                                <select
                                    value={condition.field || ''}
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateCondition(condition.id, { field: e.target.value })}
                                    className="border rounded p-1 bg-background text-foreground text-sm"
                                >
                                    {CONDITION_FIELD_OPTIONS[condition.type]?.map(option => (
                                        <option key={option.field} value={option.field}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={condition.operator || ''}
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateCondition(condition.id, { operator: e.target.value as any })}
                                    className="border rounded p-1 bg-background text-foreground text-sm"
                                >
                                    <option value="equals">Equals</option>
                                    <option value="not_equals">Not Equals</option>
                                    <option value="contains">Contains</option>
                                    <option value="greater_than">Greater Than</option>
                                    <option value="less_than">Less Than</option>
                                </select>

                                <TextInput
                                    value={(condition.value as string) || ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateCondition(condition.id, { value: e.target.value })}
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
};
