import React from 'react';
import { Button } from '@/components/ui/Button';
import { AutomationAction } from '@/types/automation';
import { ObsAction, SetCurrentProgramSceneAction } from '@/types/obsActions';
import useConnectionsStore from '@/store/connectionsStore';

// Type guards for safe ObsAction type checking
function isObsAction(data: unknown): data is ObsAction {
    return (
        typeof data === 'object' &&
        data !== null &&
        'type' in data &&
        typeof (data as any).type === 'string'
    );
}

function isSetCurrentProgramSceneAction(action: ObsAction): action is SetCurrentProgramSceneAction {
    return action.type === 'setCurrentProgramScene';
}

function hasSceneName(action: ObsAction): action is ObsAction & { sceneName: string } {
    return 'sceneName' in action && typeof (action as any).sceneName === 'string';
}

function hasActionName(data: unknown): data is { actionName: string } {
    return (
        typeof data === 'object' &&
        data !== null &&
        'actionName' in data &&
        typeof (data as any).actionName === 'string'
    );
}

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
    const { scenes, streamerBotServiceInstance } = useConnectionsStore();
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
                                    variant="destructive"
                                    size="sm"
                                >
                                    Remove
                                </Button>
                            </div>

                            {action.type === 'obs' ? (
                                <div className="space-y-2">
                                    <select
                                        value={isObsAction(action.data) ? action.data.type : ''}
                                        onChange={(e) => updateAction(action.id, {
                                            data: { type: e.target.value } as ObsAction
                                        })}
                                        className="w-full border rounded p-2 bg-background text-foreground text-sm"
                                    >
                                        <option value="">Select OBS Action...</option>
                                        <option value="setCurrentProgramScene">Switch Scene</option>
                                        <option value="setSceneItemEnabled">Enable/Disable Source</option>
                                    </select>

                                    {isObsAction(action.data) && isSetCurrentProgramSceneAction(action.data) && (
                                        <select
                                            value={hasSceneName(action.data) ? action.data.sceneName : ''}
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
                                        value={hasActionName(action.data) ? action.data.actionName : ''}
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
