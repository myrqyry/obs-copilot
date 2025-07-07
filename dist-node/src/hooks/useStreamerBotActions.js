// src/hooks/useStreamerBotActions.ts
import { useCallback } from 'react';
export const useStreamerBotActions = ({ streamerBotService, onAddMessage, setErrorMessage }) => {
    const handleStreamerBotAction = useCallback(async (action) => {
        let actionAttemptMessage = `**Streamer.bot Action: \`${action.type}\`**\n\n⚙️ Attempting: ${action.type}...`;
        try {
            // Use the generic `executeBotAction` method we created
            const response = await streamerBotService.executeBotAction(action);
            let feedback = `\n✅ Successfully executed action "${action.type}".`;
            if (response && response.status === 'ok') {
                // Action was successful
            }
            else if (response && response.error) {
                throw new Error(response.error);
            }
            actionAttemptMessage += feedback;
            // Optionally show the response from Streamer.bot
            if (response) {
                actionAttemptMessage += `\n\n---\nℹ️ Response:\n\`\`\`json\n${JSON.stringify(response, null, 2)}\n\`\`\``;
            }
            onAddMessage({ role: 'system', text: actionAttemptMessage });
        }
        catch (err) {
            console.error(`Streamer.bot Action "${action.type}" failed:`, err);
            const failureFeedback = `\n❗ Failed to execute Streamer.bot action "${action.type}": ${err.message || 'Unknown error'}`;
            actionAttemptMessage += `${failureFeedback}`;
            onAddMessage({ role: 'system', text: actionAttemptMessage });
            setErrorMessage(`Streamer.bot Action "${action.type}" failed: ${err.message}`);
        }
    }, [streamerBotService, onAddMessage, setErrorMessage]);
    return { handleStreamerBotAction };
};
