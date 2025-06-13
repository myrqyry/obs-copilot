import React from 'react';
import {
  CatppuccinAccentColorName,
  catppuccinAccentColorsHexMap,
  CatppuccinSecondaryAccentColorName,
  catppuccinSecondaryAccentColorsHexMap,
  CatppuccinChatBubbleColorName,
  catppuccinChatBubbleColorsHexMap
} from '../types';
import { Button } from './common/Button';
import { useAppStore } from '../store/appStore';
import { clearAllSettings } from '../utils/persistence';

interface ObsSettingsPanelProps {
  selectedAccentColorName: CatppuccinAccentColorName;
  onAccentColorNameChange: (name: CatppuccinAccentColorName) => void;

  selectedSecondaryAccentColorName: CatppuccinSecondaryAccentColorName;
  onSecondaryAccentColorNameChange: (name: CatppuccinSecondaryAccentColorName) => void;

  selectedUserChatBubbleColorName: CatppuccinChatBubbleColorName;
  onUserChatBubbleColorNameChange: (name: CatppuccinChatBubbleColorName) => void;

  selectedModelChatBubbleColorName: CatppuccinChatBubbleColorName;
  onModelChatBubbleColorNameChange: (name: CatppuccinChatBubbleColorName) => void;

  flipSides: boolean;
  setFlipSides: (value: boolean) => void;
}

export const ObsSettingsPanel: React.FC<ObsSettingsPanelProps> = ({
  selectedAccentColorName,
  onAccentColorNameChange,
  selectedSecondaryAccentColorName,
  onSecondaryAccentColorNameChange,
  selectedUserChatBubbleColorName,
  onUserChatBubbleColorNameChange,
  selectedModelChatBubbleColorName,
  onModelChatBubbleColorNameChange,
  flipSides,
  setFlipSides
}) => {
  // Use Zustand for auto-apply suggestions
  const { autoApplySuggestions, actions } = useAppStore();

  const ColorChooser: React.FC<{
    label: string;
    colorsHexMap: Record<string, string>;
    selectedColorName: string;
    onColorNameChange: (name: string) => void;
    colorNameTypeGuard: (name: string) => boolean;
  }> = ({ label, colorsHexMap, selectedColorName, onColorNameChange, colorNameTypeGuard }) => (
    <div className="mb-2">
      <label className="block text-sm font-medium mb-1 text-[var(--ctp-lavender)]">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {Object.keys(colorsHexMap).map((colorNameIter) => {
          if (!colorNameTypeGuard(colorNameIter)) return null;

          return (
            <button
              key={colorNameIter}
              title={colorNameIter.charAt(0).toUpperCase() + colorNameIter.slice(1)}
              onClick={() => onColorNameChange(colorNameIter)}
              className={`w-5 h-5 rounded-full border-2 transition-all duration-150 focus:outline-none
                          ${selectedColorName === colorNameIter ? 'ring-2 ring-offset-2 ring-offset-[var(--ctp-base)]' : 'border-[var(--ctp-surface1)] hover:border-[var(--ctp-overlay0)]'}
                          focus:ring-[var(--dynamic-accent)]`}
              style={{
                backgroundColor: colorsHexMap[colorNameIter],
                borderColor: selectedColorName === colorNameIter ? colorsHexMap[colorNameIter] : undefined
              }}
              aria-label={`Select ${colorNameIter} for ${label}`}
            />
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-3 bg-[var(--ctp-surface0)] p-2 rounded-lg shadow-lg border border-[var(--ctp-surface1)]">
      <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--dynamic-accent)' }}>🎨 Theme Settings</h3>

      <ColorChooser
        label="🎨 Primary Accent Color"
        colorsHexMap={catppuccinAccentColorsHexMap}
        selectedColorName={selectedAccentColorName}
        onColorNameChange={(name) => onAccentColorNameChange(name as CatppuccinAccentColorName)}
        colorNameTypeGuard={(name): name is CatppuccinAccentColorName => name in catppuccinAccentColorsHexMap}
      />
      <ColorChooser
        label="🎨 Secondary Accent Color"
        colorsHexMap={catppuccinSecondaryAccentColorsHexMap}
        selectedColorName={selectedSecondaryAccentColorName}
        onColorNameChange={(name) => onSecondaryAccentColorNameChange(name as CatppuccinSecondaryAccentColorName)}
        colorNameTypeGuard={(name): name is CatppuccinSecondaryAccentColorName => name in catppuccinSecondaryAccentColorsHexMap}
      />
      <ColorChooser
        label="💬 User Chat Bubble Color"
        colorsHexMap={catppuccinChatBubbleColorsHexMap}
        selectedColorName={selectedUserChatBubbleColorName}
        onColorNameChange={(name) => onUserChatBubbleColorNameChange(name as CatppuccinChatBubbleColorName)}
        colorNameTypeGuard={(name): name is CatppuccinChatBubbleColorName => name in catppuccinChatBubbleColorsHexMap}
      />
      <ColorChooser
        label="🤖 Model Chat Bubble Color"
        colorsHexMap={catppuccinChatBubbleColorsHexMap}
        selectedColorName={selectedModelChatBubbleColorName}
        onColorNameChange={(name) => onModelChatBubbleColorNameChange(name as CatppuccinChatBubbleColorName)}
        colorNameTypeGuard={(name): name is CatppuccinChatBubbleColorName => name in catppuccinChatBubbleColorsHexMap}
      />

      <div className="space-y-2 mt-2 mb-2">
        <label className="flex items-center text-sm text-[var(--ctp-lavender)] cursor-pointer">
          <input
            type="checkbox"
            checked={flipSides}
            onChange={e => setFlipSides(e.target.checked)}
            className="mr-2 accent-[var(--dynamic-accent)]"
          />
          Flip assistant/user chat sides
        </label>

        <label className="flex items-center text-sm text-[var(--ctp-lavender)] cursor-pointer">
          <input
            type="checkbox"
            checked={autoApplySuggestions}
            onChange={actions.toggleAutoApplySuggestions}
            className="mr-2 accent-[var(--dynamic-accent)]"
          />
          Auto-apply chat suggestions (send immediately when clicked)
        </label>
      </div>

      {/* Settings Reset Section */}
      <div className="bg-[var(--ctp-mantle)] p-3 rounded-lg border border-[var(--ctp-surface0)] mb-3">
        <h3 className="text-sm font-medium text-[var(--ctp-lavender)] mb-2">🔄 Reset Settings</h3>
        <p className="text-xs text-[var(--ctp-subtext0)] mb-3">
          Clear all saved preferences and return to defaults. This will reset theme colors, connection settings, and other preferences.
        </p>
        <Button
          onClick={() => {
            if (confirm('Are you sure you want to reset all settings to defaults? This will clear your saved connection details, theme preferences, and other settings.')) {
              clearAllSettings();
              // Reload the page to reset the store state
              window.location.reload();
            }
          }}
          variant="danger"
          size="sm"
          accentColorName={selectedAccentColorName}
        >
          Reset All Settings
        </Button>
      </div>
    </div>
  );
};
