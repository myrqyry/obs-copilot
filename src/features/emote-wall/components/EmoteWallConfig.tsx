import React from 'react';
import useEmoteWallStore from '@/app/store/emoteWallStore';
import { Label } from '@/shared/components/ui/label';
import { Switch } from '@/shared/components/ui/switch';
import { Input } from '@/shared/components/ui/input';
import EmoteWallThemeSelector from './EmoteWallThemeSelector';
import ConfigSection from '@/shared/components/common/ConfigSection';
import ConfigToggle from '@/shared/components/common/ConfigToggle';
import ConfigInput from '@/shared/components/common/ConfigInput';

const EmoteWallConfig: React.FC = () => {
  const { enabled, setEnabled, themeId, setThemeId, channel, setChannel } = useEmoteWallStore();

  return (
    <ConfigSection title="Emote Wall">

      <ConfigToggle
        id="emote-wall-enabled"
        label="Enable Emote Wall"
        description="Allow emotes from chat to appear on the screen."
        checked={enabled}
        onCheckedChange={setEnabled}
      />

      {enabled && (
        <div className="space-y-4">
          <ConfigInput
            id="emote-wall-channel"
            label="Twitch Channel"
            placeholder="Enter Twitch channel name (e.g., myrqyry)"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
          />
          <EmoteWallThemeSelector
            currentThemeId={themeId}
            onThemeChange={setThemeId}
          />
        </div>
      )}
    </ConfigSection>
  );
};

export default EmoteWallConfig;