// src/hooks/useStreamerBotActions.ts

import { useCallback } from 'react';
import type { StreamerBotService } from '../services/streamerBotService';

interface UseStreamerBotActionsProps {
    streamerBotService: StreamerBotService;
    onAddMessage: (message: { role: 'system'; text: string }) => void;
    setErrorMessage: (message: string | null) => void;
}

export const useStreamerBotActions = ({
    streamerBotService,
    onAddMessage,
    setErrorMessage
}: UseStreamerBotActionsProps) => {
    const handleStreamerBotAction = useCallback(async (action: { type: string, args?: Record<string, any> }) => {
        let actionAttemptMessage = `**Streamer.bot Action: \`${action.type}\`**\n\n⚙️ Attempting: ${action.type}...`;

        try {
            // Use the generic `executeBotAction` method we created
            const response = await streamerBotService.executeBotAction(action);

            let feedback = `\n✅ Successfully executed action "${action.type}".`;
            if (response && response.status === 'ok') {
                // Action was successful
            } else if (response && response.error) {
                throw new Error(response.error);
            }

            actionAttemptMessage += feedback;

            // Optionally show the response from Streamer.bot
            if (response) {
                actionAttemptMessage += `\n\n---\nℹ️ Response:\n\`\`\`json\n${JSON.stringify(response, null, 2)}\n\`\`\``;
            }

            onAddMessage({ role: 'system', text: actionAttemptMessage });

        } catch (err: any) {
            console.error(`Streamer.bot Action "${action.type}" failed:`, err);
            const failureFeedback = `\n❗ Failed to execute Streamer.bot action "${action.type}": ${(err as Error).message || 'Unknown error'}`;
            actionAttemptMessage += `${failureFeedback}`;
            onAddMessage({ role: 'system', text: actionAttemptMessage });
            setErrorMessage(`Streamer.bot Action "${action.type}" failed: ${(err as Error).message}`);
        }
    }, [streamerBotService, onAddMessage, setErrorMessage]);

    return { handleStreamerBotAction };
};