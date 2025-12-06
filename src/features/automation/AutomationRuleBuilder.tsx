import React from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Modal } from '@/shared/components/ui/Modal';
import { useAutomationRuleBuilder } from '@/shared/hooks/useAutomationRuleBuilder';
import { TriggerStep } from './TriggerStep';
import { ConditionsStep } from './ConditionsStep';
import { ActionsStep } from './ActionsStep';
import { ReviewStep } from './ReviewStep';
import { AutomationRule } from '@/shared/types/automation';
import { cn } from '@/shared/lib/utils';

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
    console.log('AutomationRuleBuilder mounted:', { isOpen, initialEventName, editingRuleExists: !!editingRule });

    const {
        ruleName,
        setRuleName,
        enabled,
        setEnabled,
        trigger,
        setTrigger,
        conditions,
        addCondition,
        updateCondition,
        removeCondition,
        actions,
        addAction,
        updateAction,
        removeAction,
        currentStep,
        setCurrentStep,
        handleSave,
    } = useAutomationRuleBuilder(isOpen, initialEventName, editingRule);

    const renderStepIndicator = () => (
        <div className="flex items-center space-x-2 mb-6">
            {['trigger', 'conditions', 'actions', 'review'].map((step, index) => (
                <React.Fragment key={step}>
                    <Button
                        onClick={() => setCurrentStep(step as any)}
                        variant={currentStep === step ? "default" : "outline"}
                        size="sm"
                        className={cn(
                            "w-8 h-8 rounded-full text-sm font-medium transition-colors flex items-center justify-center p-0",
                            currentStep === step
                                ? "bg-accent text-accent-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                    >
                        {index + 1}
                    </Button>
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

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 'trigger':
                return <TriggerStep ruleName={ruleName} setRuleName={setRuleName} trigger={trigger} setTrigger={setTrigger} enabled={enabled} setEnabled={setEnabled} />;
            case 'conditions':
                return <ConditionsStep conditions={conditions} addCondition={addCondition} updateCondition={updateCondition} removeCondition={removeCondition} />;
            case 'actions':
                return <ActionsStep actions={actions} addAction={addAction} updateAction={updateAction} removeAction={removeAction} />;
            case 'review':
                return <ReviewStep rule={{ id: '', name: ruleName, enabled, trigger, conditions, actions, createdAt: new Date(), triggerCount: 0, cooldown: 0 }} />;
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
                                variant="outline"
                                size="sm"
                            >
                                Previous
                            </Button>
                        )}
                    </div>
    
                    <div className="space-x-2">
                        <Button onClick={onClose} variant="outline" size="sm">
                            Cancel
                        </Button>
    
                        {currentStep !== 'review' ? (
                            <Button
                                onClick={() => {
                                    const steps = ['trigger', 'conditions', 'actions', 'review'];
                                    const currentIndex = steps.indexOf(currentStep);
                                    setCurrentStep(steps[currentIndex + 1] as any);
                                }}
                                size="sm"
                            >
                                Next
                            </Button>
                        ) : (
                            <Button onClick={handleSave} size="sm">
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
