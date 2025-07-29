import { useState, useEffect } from 'react';
import type {
  AutomationRule,
  AutomationTrigger,
  AutomationCondition,
  AutomationAction,
} from '../types/automation';
import { useAutomationStore } from '../store/automationStore';
import type { ObsAction } from '../types/obsActions';

export const useAutomationRuleBuilder = (
  isOpen: boolean,
  initialEventName?: string,
  editingRule?: AutomationRule | null,
) => {
  const { addAutomationRule, updateAutomationRule } = useAutomationStore((state) => state.actions);

  const [ruleName, setRuleName] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [trigger, setTrigger] = useState<AutomationTrigger>({
    eventName: initialEventName || '',
    eventData: {},
  });
  const [conditions, setConditions] = useState<AutomationCondition[]>([]);
  const [actions, setActions] = useState<AutomationAction[]>([]);
  const [currentStep, setCurrentStep] = useState<'trigger' | 'conditions' | 'actions' | 'review'>(
    'trigger',
  );

  useEffect(() => {
    if (editingRule) {
      setRuleName(editingRule.name);
      setEnabled(editingRule.enabled);
      setTrigger(editingRule.trigger);
      setConditions(editingRule.conditions || []);
      setActions(editingRule.actions);
    } else if (initialEventName) {
      setTrigger((prev) => ({ ...prev, eventName: initialEventName }));
    }
  }, [editingRule, initialEventName]);

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
    if (!ruleName.trim() || !trigger.eventName || actions.length === 0) {
      alert('Please fill out all required fields.');
      return;
    }

    const rule: AutomationRule = {
      id: editingRule?.id || `rule-${Date.now()}`,
      name: ruleName.trim(),
      enabled,
      trigger,
      conditions: conditions.length > 0 ? conditions : undefined,
      actions,
      createdAt: editingRule?.createdAt || new Date(),
      triggerCount: editingRule?.triggerCount || 0,
    };

    if (editingRule) {
      updateAutomationRule(editingRule.id, rule);
    } else {
      addAutomationRule(rule);
    }
  };

  const addCondition = () => {
    const newCondition: AutomationCondition = {
      id: `condition-${Date.now()}`,
      type: 'scene',
      field: 'currentProgramScene',
      operator: 'equals',
      value: '',
    };
    setConditions([...conditions, newCondition]);
  };

  const updateCondition = (id: string, updates: Partial<AutomationCondition>) => {
    setConditions(conditions.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const removeCondition = (id: string) => {
    setConditions(conditions.filter((c) => c.id !== id));
  };

  const addAction = (type: 'obs' | 'streamerbot') => {
    const newAction: AutomationAction = {
      id: `action-${Date.now()}`,
      type,
      data:
        type === 'obs'
          ? ({ type: 'setCurrentProgramScene', sceneName: '' } as ObsAction)
          : { actionName: '', args: {} },
    };
    setActions([...actions, newAction]);
  };

  const updateAction = (id: string, updates: Partial<AutomationAction>) => {
    setActions(actions.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  const removeAction = (id: string) => {
    setActions(actions.filter((a) => a.id !== id));
  };

  return {
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
  };
};
