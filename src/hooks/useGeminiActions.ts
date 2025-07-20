import { useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import { useLockStore } from '../store/lockStore';
import { useSafeModeStore } from '../store/safeModeStore';
import type { GeminiActionResponse } from '../types/obsActions';

interface UseGeminiActionsProps {
    onStreamerBotAction: (action: { type: string, args?: Record<string, any> }) => Promise<void>;
    onRefreshData: () => Promise<void>;
}

export const useGeminiActions = ({ onStreamerBotAction, onRefreshData }: UseGeminiActionsProps) => {
    const { isConnected, actions, addMessage } = useAppStore();
    const { isLocked } = useLockStore();
    const showSafeModeModal = useSafeModeStore((state) => state.showModal);

    const handleGeminiAction = useCallback(async (parsed: GeminiActionResponse) => {
        let obsActionResult: { success: boolean; message: string; error?: string } | null = null;

        if (parsed.obsAction && isConnected) {
            const lockMap: Record<string, string> = {
                startStream: 'streamRecord',
                stopStream: 'streamRecord',
                toggleStream: 'streamRecord',
                startRecord: 'streamRecord',
                stopRecord: 'streamRecord',
                toggleRecord: 'streamRecord',
                setVideoSettings: 'videoSettings',
            };

            const checkLocked = (action: any) => {
                const lockKey = lockMap[action.type];
                return lockKey && isLocked(lockKey);
            };

            const criticalActions = ['startStream', 'stopStream', 'toggleStream', 'startRecord', 'stopRecord', 'toggleRecord', 'setVideoSettings', 'removeInput', 'removeScene'];
            const isCritical = (action: any) => criticalActions.includes(action.type);

            const handleActionExecution = async (action: any) => {
                if (isLocked(lockMap[action.type])) {
                    addMessage({ role: 'system', text: "Looks like you've locked this setting, so I won't change it for you. If you want me to help with this, just unlock it in the settings!" });
                    return;
                }

                if (isCritical(action)) {
                    showSafeModeModal(`Execute OBS action: ${action.type}`, async () => {
                        obsActionResult = await actions.handleObsAction(action);
                        await onRefreshData();
                    }, () => {
                        addMessage({ role: 'system', text: `Cancelled OBS action: ${action.type}` });
                    });
                } else {
                    obsActionResult = await actions.handleObsAction(action);
                    await onRefreshData();
                }
            };

            if (Array.isArray(parsed.obsAction)) {
                const lockedAction = parsed.obsAction.find(checkLocked);
                if (lockedAction) {
                    addMessage({ role: 'system', text: "Looks like you've locked this setting, so I won't change it for you. If you want me to help with this, just unlock it in the settings!" });
                } else {
                    for (const action of parsed.obsAction) {
                        await handleActionExecution(action);
                    }
                }
            } else {
                await handleActionExecution(parsed.obsAction);
            }
        }

        if (parsed.streamerBotAction) {
            await onStreamerBotAction(parsed.streamerBotAction);
        }

        return obsActionResult;
    }, [isConnected, actions, addMessage, isLocked, showSafeModeModal, onStreamerBotAction, onRefreshData]);

    return { handleGeminiAction };
};
