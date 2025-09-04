import React from 'react';
import { CustomButton as Button } from '@/components/ui/CustomButton';
import { AutomationAction, FileExistsActionData, FolderExistsActionData, StreamerBotActionData } from '@/types/automation';
import { ObsAction, SetCurrentProgramSceneAction } from '@/types/obsActions';
import useConnectionsStore from '@/store/connectionsStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

function isFileExistsActionData(data: unknown): data is FileExistsActionData {
    return (
        typeof data === 'object' &&
        data !== null &&
        'type' in data &&
        (data as any).type === 'FileExists'
    );
}

function isFolderExistsActionData(data: unknown): data is FolderExistsActionData {
    return (
        typeof data === 'object' &&
        data !== null &&
        'type' in data &&
        (data as any).type === 'FolderExists'
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
                                        <option value="FileExists">File Exists</option>
                                        <option value="FolderExists">Folder Exists</option>
                                        {streamerBotActions.map(sbAction => (
                                            <option key={sbAction.id} value={sbAction.name}>
                                                {sbAction.name}
                                            </option>
                                        ))}
                                    </select>

                                    {isFileExistsActionData(action.data) && (
                                        <div className="space-y-2">
                                            <Label htmlFor={`file-path-${action.id}`}>File Path</Label>
                                            <Input
                                                id={`file-path-${action.id}`}
                                                placeholder="C:\path\to\file.txt"
                                                value={action.data.path}
                                                onChange={(e) => updateAction(action.id, {
                                                    data: { ...action.data, path: e.target.value } as FileExistsActionData
                                                })}
                                            />
                                            <Label htmlFor={`file-variable-${action.id}`}>Variable Name (optional)</Label>
                                            <Input
                                                id={`file-variable-${action.id}`}
                                                placeholder="file_exists_result"
                                                value={action.data.variableName || ''}
                                                onChange={(e) => updateAction(action.id, {
                                                    data: { ...action.data, variableName: e.target.value } as FileExistsActionData
                                                })}
                                            />
                                        </div>
                                    )}

                                    {isFolderExistsActionData(action.data) && (
                                        <div className="space-y-2">
                                            <Label htmlFor={`folder-path-${action.id}`}>Folder Path</Label>
                                            <Input
                                                id={`folder-path-${action.id}`}
                                                placeholder="C:\path\to\folder"
                                                value={action.data.path}
                                                onChange={(e) => updateAction(action.id, {
                                                    data: { ...action.data, path: e.target.value } as FolderExistsActionData
                                                })}
                                            />
                                            <Label htmlFor={`folder-variable-${action.id}`}>Variable Name (optional)</Label>
                                            <Input
                                                id={`folder-variable-${action.id}`}
                                                placeholder="folder_exists_result"
                                                value={action.data.variableName || ''}
                                                onChange={(e) => updateAction(action.id, {
                                                    data: { ...action.data, variableName: e.target.value } as FolderExistsActionData
                                                })}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
