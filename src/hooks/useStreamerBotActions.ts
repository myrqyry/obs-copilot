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
  setErrorMessage,
}: UseStreamerBotActionsProps) => {
  const handleStreamerBotAction = useCallback(
    async (action: { type: string; args?: Record<string, unknown> }) => {
      let actionAttemptMessage = `**Streamer.bot Action: \`${action.type}\`**

⚙️ Attempting: ${action.type}...`;

      try {
        // Use the generic `executeBotAction` method we created
        const response = await streamerBotService.executeBotAction(action);

        const feedback = `
✅ Successfully executed action "${action.type}".`;
        if (response && (response as { status: string }).status === 'ok') {
          // Action was successful
        } else if (response && (response as { error: string }).error) {
          throw new Error((response as { error: string }).error);
        }

        actionAttemptMessage += feedback;

        // Optionally show the response from Streamer.bot
        if (response) {
          actionAttemptMessage += `

---
ℹ️ Response:
\`\`\`json
${JSON.stringify(response, null, 2)}
\`\`\``;
        }

        onAddMessage({ role: 'system', text: actionAttemptMessage });
      } catch (err: unknown) {
        console.error(`Streamer.bot Action "${action.type}" failed:`, err);
        const failureFeedback = `
❗ Failed to execute Streamer.bot action "${action.type}": ${
          err instanceof Error ? err.message : 'Unknown error'
        }`;
        actionAttemptMessage += `${failureFeedback}`;
        onAddMessage({ role: 'system', text: actionAttemptMessage });
        setErrorMessage(
          `Streamer.bot Action "${action.type}" failed: ${
            err instanceof Error ? err.message : 'Unknown error'
          }`,
        );
      }
    },
    [streamerBotService, onAddMessage, setErrorMessage],
  );

  return { handleStreamerBotAction };
};
