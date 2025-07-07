import React from 'react';
import type { AutomationRule } from '../types/automation';
interface AutomationRuleBuilderProps {
    isOpen: boolean;
    onClose: () => void;
    initialEventName?: string;
    editingRule?: AutomationRule | null;
}
export declare const AutomationRuleBuilder: React.FC<AutomationRuleBuilderProps>;
export default AutomationRuleBuilder;
