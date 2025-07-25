import React from 'react';
import { Modal } from './common/Modal';
import { Button } from './common/Button';
import { useAutomationRuleBuilder } from '../../hooks/useAutomationRuleBuilder';
import { TriggerStep } from './automation/TriggerStep';
import { ConditionsStep } from './automation/ConditionsStep';
import { ActionsStep } from './automation/ActionsStep';
import { ReviewStep } from './automation/ReviewStep';
import { AutomationRule } from '../../types/automation';
import { cn } from '../../lib/utils';

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

    const onSave = () => {
        handleSave();
        onClose();
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

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 'trigger':
                return <TriggerStep ruleName={ruleName} setRuleName={setRuleName} trigger={trigger} setTrigger={setTrigger} enabled={enabled} setEnabled={setEnabled} />;
            case 'conditions':
                return <ConditionsStep conditions={conditions} addCondition={addCondition} updateCondition={updateCondition} removeCondition={removeCondition} />;
            case 'actions':
                return <ActionsStep actions={actions} addAction={addAction} updateAction={updateAction} removeAction={removeAction} />;
            case 'review':
                return <ReviewStep rule={{ id: '', name: ruleName, enabled, trigger, conditions, actions, createdAt: new Date(), triggerCount: 0 }} />;
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
