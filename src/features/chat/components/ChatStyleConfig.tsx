import React from 'react';
import { ChatThemes } from '../styles/ChatThemes';

export interface Customizations {
  emoteProviders: {
    twitch: boolean;
    bttv: boolean;
    ffz: boolean;
    seventv: boolean;
  };
  effects: {
    animateEmotes: boolean;
    emoteScale: number;
    showBadges: boolean;
    showTimestamps: boolean;
  };
  filtering: {
    hideCommands: boolean;
    minMessageLength: number;
    blockedWords: string[];
  };
}

interface ChatStyleConfigProps {
  selectedTheme: string;
  onThemeChange: (themeKey: string) => void;
  customizations: Customizations;
  onCustomizationsChange: (customizations: Customizations) => void;
}

const ChatStyleConfig: React.FC<ChatStyleConfigProps> = ({
  selectedTheme,
  onThemeChange,
  customizations,
  onCustomizationsChange,
}) => {
  return (
    <div className="space-y-6 p-4">
      {/* Theme Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Chat Theme</h3>
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(ChatThemes).map(([key, theme]) => (
            <button
              key={key}
              onClick={() => onThemeChange(key)}
              className={`p-3 rounded-lg border-2 ${
                selectedTheme === key
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="text-sm font-medium">{theme.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {theme.font.family} • {theme.font.size}px
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Emote Providers */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Emote Providers</h3>
        <div className="space-y-2">
          {Object.entries(customizations.emoteProviders).map(([provider, enabled]) => (
            <label key={provider} className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => onCustomizationsChange({
                  ...customizations,
                  emoteProviders: {
                    ...customizations.emoteProviders,
                    [provider]: e.target.checked
                  }
                })}
                className="rounded"
              />
              <span className="text-sm capitalize">{provider}</span>
              {provider === 'bttv' && <span className="text-xs text-gray-500 dark:text-gray-400">BetterTTV</span>}
              {provider === 'ffz' && <span className="text-xs text-gray-500 dark:text-gray-400">FrankerFaceZ</span>}
              {provider === 'seventv' && <span className="text-xs text-gray-500 dark:text-gray-400">7TV</span>}
            </label>
          ))}
        </div>
      </div>

      {/* Effects & Customization */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Effects</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Emote Scale: {customizations.effects.emoteScale.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={customizations.effects.emoteScale}
              onChange={(e) => onCustomizationsChange({
                ...customizations,
                effects: {
                  ...customizations.effects,
                  emoteScale: parseFloat(e.target.value)
                }
              })}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatStyleConfig;