import React from 'react';
import { Button } from '../common/Button';
import { TextInput } from '../common/TextInput';
import { AutomationAction } from '../../types/automation';
import { ObsAction } from '../../types/obsActions';
import { useObsStore } from '../../store/obsStore';
import { useAutomationStore } from '../../store/automationStore';

interface ActionsStepProps {
    actions: AutomationAction[];
    addAction: (type: 'obs' | 'streamerbot') => void;
    updateAction: (id: string, updates: Partial<AutomationAction>) => void;
    removeAction: (id: string) => void;
}

export const ActionsStep: React.FC<ActionsStepProps> = ({
    actions,
    addAction,
    updateAction,
    removeAction,
}) => {
    const { scenes } = useObsStore();
    const { streamerBotServiceInstance } = useAutomationStore();
    const [streamerBotActions, setStreamerBotActions] = React.useState<any[]>([]);

    React.useEffect(() => {
        if (streamerBotServiceInstance) {
            streamerBotServiceInstance.getActions().then(setStreamerBotActions);
        }
    }, [streamerBotServiceInstance]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-foreground">Actions</h3>
                <div className="space-x-2">
                    <Button onClick={() => addAction('obs')} size="sm">
                        Add OBS Action
                    </Button>
                    <Button onClick={() => addAction('streamerbot')} size="sm" variant="secondary">
                        Add Streamer.bot Action
                    </Button>
                </div>
            </div>

            <p className="text-sm text-muted-foreground">
                Define what should happen when this rule is triggered.
            </p>

            {actions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    <p>No actions added. Add at least one action for the rule to do something.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {actions.map((action, index) => (
                        <div key={action.id} className="border rounded p-3 bg-muted/20">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-foreground">
                                    {action.type === 'obs' ? '🎛️ OBS' : '🤖 Streamer.bot'} Action {index + 1}
                                </span>
                                <Button
                                    onClick={() => removeAction(action.id)}
                                    variant="danger"
                                    size="sm"
                                >
                                    Remove
                                </Button>
                            </div>

                            {action.type === 'obs' ? (
                                <div className="space-y-2">
                                    <select
                                        value={(action.data as ObsAction).type}
                                        onChange={(e) => updateAction(action.id, {
                                            data: { type: e.target.value } as ObsAction
                                        })}
                                        className="w-full border rounded p-2 bg-background text-foreground text-sm"
                                    >
                                        <option value="">Select OBS Action...</option>
                                        <option value="setCurrentProgramScene">Switch Scene</option>
                                        <option value="setSceneItemEnabled">Enable/Disable Source</option>
                                    </select>

                                    {(action.data as ObsAction).type === 'setCurrentProgramScene' && (
                                        <select
                                            value={(action.data as any).sceneName || ''}
                                            onChange={(e) => updateAction(action.id, {
                                                data: { type: 'setCurrentProgramScene', sceneName: e.target.value }
                                            })}
                                            className="w-full border rounded p-2 bg-background text-foreground text-sm"
                                        >
                                            <option value="">Select Scene...</option>
                                            {scenes.map(scene => (
                                                <option key={scene.sceneName} value={scene.sceneName}>
                                                    {scene.sceneName}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <select
                                        value={(action.data as any).actionName || ''}
                                        onChange={(e) => updateAction(action.id, {
                                            data: { actionName: e.target.value, args: {} }
                                        })}
                                        className="w-full border rounded p-2 bg-background text-foreground text-sm"
                                    >
                                        <option value="">Select Streamer.bot Action...</option>
                                        {streamerBotActions.map(sbAction => (
                                            <option key={sbAction.id} value={sbAction.name}>
                                                {sbAction.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
