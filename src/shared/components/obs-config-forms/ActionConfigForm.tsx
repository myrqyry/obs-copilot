import React from 'react';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { ActionConfig, ObsActionName } from '@/shared/types/obs';

interface ActionConfigFormProps {
  config: Partial<ActionConfig>;
  onConfigChange: (newConfig: Partial<ActionConfig>) => void;
  scenes: string[];
  sources: string[];
}

export const ActionConfigForm: React.FC<ActionConfigFormProps> = ({
  config,
  onConfigChange,
  scenes,
  sources,
}) => {
  const handleActionChange = (action: ObsActionName) => {
    const baseConfig = { ...config, type: 'action', action };
    if (action === 'switch_scene') {
      onConfigChange({ ...baseConfig, sourceName: undefined });
    } else if (action === 'toggle_mute') {
      onConfigChange({ ...baseConfig, sceneName: undefined });
    } else {
      onConfigChange(baseConfig);
    }
  };

  return (
    <>
      <div>
        <Label htmlFor="action-type">Action</Label>
        <Select
          onValueChange={(value: ObsActionName) => handleActionChange(value)}
          value={config.action}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select action type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="toggle_mute">Toggle Mute</SelectItem>
            <SelectItem value="switch_scene">Switch Scene</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {config.action === 'switch_scene' && (
        <div>
          <Label htmlFor="scene-name">Scene</Label>
          <Select
            onValueChange={(sceneName) => onConfigChange({ ...config, sceneName })}
            value={config.sceneName}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select scene" />
            </SelectTrigger>
            <SelectContent>
              {scenes.length === 0 ? (
                <SelectItem value="__none__" disabled>
                  No scenes available
                </SelectItem>
              ) : (
                scenes
                  .filter((s) => s != null && s !== '')
                  .map((scene) => (
                    <SelectItem key={scene} value={scene}>
                      {scene}
                    </SelectItem>
                  ))
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      {config.action === 'toggle_mute' && (
        <div>
          <Label htmlFor="source-name">Source</Label>
          <Select
            onValueChange={(sourceName) => onConfigChange({ ...config, sourceName })}
            value={config.sourceName}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select source" />
            </SelectTrigger>
            <SelectContent>
              {sources.length === 0 ? (
                <SelectItem value="__none__" disabled>
                  No sources available
                </SelectItem>
              ) : (
                sources
                  .filter((s) => s != null && s !== '')
                  .map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))
              )}
            </SelectContent>
          </Select>
        </div>
      )}
    </>
  );
};
