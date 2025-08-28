import React, { useEffect } from 'react';
import { useAutomationStore } from '@/store/automationStore';
import { useConnectionManagerStore } from '@/store/connectionManagerStore';
import { automationService } from '@/services/automationService';

const AdvancedPanel: React.FC = () => {
    // Automation Rules (used by automationService)
    const automationRules = useAutomationStore((state) => state.automationRules);

    // Connection Manager - call wrapper with NO selector to receive the augmented store (includes actions)
    const connectionManager = useConnectionManagerStore();
    const { obsServiceInstance, streamerBotServiceInstance, actions } = connectionManager;
    const handleObsAction = actions?.handleObsAction ?? (async () => Promise.resolve());

    // Minimal addMessage used by automationService.initialize - keep as a concrete function so TS/linter don't mark it unused/implicit-any
    const addMessage = (message: { role: 'user' | 'model' | 'system'; text: string }) => {
        // Intentionally a noop placeholder — automationService expects a callable that accepts a message object
        // If a real messaging function is available elsewhere, this can be replaced later.
        // eslint-disable-next-line no-console
        console.warn('addMessage noop called:', message);
    };

    // Initialize automation service when services are available
    useEffect(() => {
        if (obsServiceInstance || streamerBotServiceInstance) {
            automationService.initialize(
                automationRules,
                streamerBotServiceInstance,
                handleObsAction,
                addMessage
            );
        }
    }, [obsServiceInstance, streamerBotServiceInstance, automationRules]);

    // Simplified component tree
    return (
        <div className="space-y-2 max-w-2xl mx-auto p-0">
        </div>
    );
};

export default AdvancedPanel;
