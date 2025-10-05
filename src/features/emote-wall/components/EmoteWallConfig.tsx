import React from 'react';
import useEmoteWallStore from '@/store/emoteWallStore';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import EmoteWallThemeSelector from './EmoteWallThemeSelector';

const EmoteWallConfig: React.FC = () => {
  const { enabled, setEnabled, themeId, setThemeId } = useEmoteWallStore();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold border-b pb-2">Emote Wall</h2>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <Label htmlFor="emote-wall-enabled" className="font-semibold">
            Enable Emote Wall
          </Label>
          <p className="text-sm text-muted-foreground">
            Allow emotes from chat to appear on the screen.
          </p>
        </div>
        <Switch
          id="emote-wall-enabled"
          checked={enabled}
          onCheckedChange={setEnabled}
        />
      </div>

      {enabled && (
        <div className="space-y-4">
          <EmoteWallThemeSelector
            currentThemeId={themeId}
            onThemeChange={setThemeId}
          />
        </div>
      )}
    </div>
  );
};

export default EmoteWallConfig;