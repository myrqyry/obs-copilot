

import React, { useState, useEffect } from 'react';
import {
  OBSVideoSettings,
  CatppuccinAccentColorName,
  catppuccinAccentColorsHexMap,
  CatppuccinSecondaryAccentColorName,
  catppuccinSecondaryAccentColorsHexMap,
  CatppuccinChatBubbleColorName,
  catppuccinChatBubbleColorsHexMap
} from '../types';
import { OBSWebSocketService } from '../services/obsService';
import { Button } from './common/Button';
import { TextInput } from './common/TextInput';
import { LoadingSpinner } from './common/LoadingSpinner';

interface ObsSettingsPanelProps {
  obsService: OBSWebSocketService;
  videoSettings: OBSVideoSettings | null;
  onSettingsChanged: () => Promise<void>;
  setErrorMessage: (message: string | null) => void;

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
  obsService,
  videoSettings: initialVideoSettings,
  onSettingsChanged,
  setErrorMessage,
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
  const [editableSettings, setEditableSettings] = useState<OBSVideoSettings | null>(initialVideoSettings);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setEditableSettings(initialVideoSettings);
  }, [initialVideoSettings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editableSettings) return;
    const { name, value } = e.target;
    setEditableSettings({
      ...editableSettings,
      [name]: parseInt(value, 10) || 0,
    });
  };

  const handleSaveChanges = async () => {
    if (!editableSettings) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await obsService.setVideoSettings(editableSettings);
      await onSettingsChanged();
    } catch (error: any) {
      console.error("Error saving video settings:", error);
      setErrorMessage(`Failed to save settings: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const ColorChooser: React.FC<{
    label: string;
    colorsHexMap: Record<string, string>;
    selectedColorName: string;
    onColorNameChange: (name: any) => void;
    colorNameTypeGuard: (name: string) => name is CatppuccinAccentColorName | CatppuccinSecondaryAccentColorName | CatppuccinChatBubbleColorName;
  }> = ({ label, colorsHexMap, selectedColorName, onColorNameChange, colorNameTypeGuard }) => (
    <div className="bg-[var(--ctp-mantle)] p-2 rounded-lg shadow-md border border-[var(--ctp-surface0)] mb-3"> {/* Reduced p and mb */}
      <label className="block text-sm font-medium text-[var(--ctp-lavender)] mb-1.5">{label}:</label> {/* Reduced mb */}
      <div className="flex flex-wrap gap-1.5"> {/* Reduced gap */}
        {(Object.keys(colorsHexMap) as string[]).map(colorNameIter => {
          if (!colorNameTypeGuard(colorNameIter)) return null;
          return (
            <button
              key={colorNameIter}
              title={colorNameIter.charAt(0).toUpperCase() + colorNameIter.slice(1)}
              onClick={() => onColorNameChange(colorNameIter)}
              className={`w-5 h-5 rounded-full border-2 transition-all duration-150 focus:outline-none
                          ${selectedColorName === colorNameIter ? 'ring-2 ring-offset-2 ring-offset-[var(--ctp-base)]' : 'border-[var(--ctp-surface1)] hover:border-[var(--ctp-overlay0)]'}
                          focus:ring-[var(--dynamic-accent)]`} // Reduced size
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


  if (!editableSettings && !initialVideoSettings && !isLoading) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner size={10} /></div>;
  }

  if (!editableSettings && !isLoading) {
    return <p className="text-[var(--ctp-subtext0)] text-center p-4">🎥 Video settings not available or not loaded yet.</p>;
  }


  return (
    <div className="space-y-3 bg-[var(--ctp-surface0)] p-2 rounded-lg shadow-lg border border-[var(--ctp-surface1)]"> {/* Reduced p and space-y */}
      <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--dynamic-accent)' }}>🎨 Theme & 🎞️ Video Settings</h3> {/* Reduced mb */}

      <ColorChooser
        label="🎨 Primary Accent Color"
        colorsHexMap={catppuccinAccentColorsHexMap}
        selectedColorName={selectedAccentColorName}
        onColorNameChange={onAccentColorNameChange}
        colorNameTypeGuard={(name): name is CatppuccinAccentColorName => name in catppuccinAccentColorsHexMap}
      />
      <ColorChooser
        label="🎨 Secondary Accent Color"
        colorsHexMap={catppuccinSecondaryAccentColorsHexMap}
        selectedColorName={selectedSecondaryAccentColorName}
        onColorNameChange={onSecondaryAccentColorNameChange}
        colorNameTypeGuard={(name): name is CatppuccinSecondaryAccentColorName => name in catppuccinSecondaryAccentColorsHexMap}
      />
      <ColorChooser
        label="💬 User Chat Bubble Color"
        colorsHexMap={catppuccinChatBubbleColorsHexMap}
        selectedColorName={selectedUserChatBubbleColorName}
        onColorNameChange={onUserChatBubbleColorNameChange}
        colorNameTypeGuard={(name): name is CatppuccinChatBubbleColorName => name in catppuccinChatBubbleColorsHexMap}
      />
      <ColorChooser
        label="🤖 Model Chat Bubble Color"
        colorsHexMap={catppuccinChatBubbleColorsHexMap}
        selectedColorName={selectedModelChatBubbleColorName}
        onColorNameChange={onModelChatBubbleColorNameChange}
        colorNameTypeGuard={(name): name is CatppuccinChatBubbleColorName => name in catppuccinChatBubbleColorsHexMap}
      />

      <div className="flex items-center mt-2 mb-2">
        <label className="flex items-center text-sm text-[var(--ctp-lavender)] cursor-pointer">
          <input
            type="checkbox"
            checked={flipSides}
            onChange={e => setFlipSides(e.target.checked)}
            className="mr-2 accent-[var(--dynamic-accent)]"
          />
          Flip assistant/user chat sides
        </label>
      </div>


      {editableSettings ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2"> {/* Reduced gap */}
            <TextInput
              label="Base (Canvas) Width"
              id="baseWidth"
              name="baseWidth"
              type="number"
              value={editableSettings.baseWidth}
              onChange={handleInputChange}
              disabled={isLoading}
              accentColorName={selectedAccentColorName}
              className="text-xs"
            />
            <TextInput
              label="Base (Canvas) Height"
              id="baseHeight"
              name="baseHeight"
              type="number"
              value={editableSettings.baseHeight}
              onChange={handleInputChange}
              disabled={isLoading}
              accentColorName={selectedAccentColorName}
              className="text-xs"
            />
            <TextInput
              label="Output (Scaled) Width"
              id="outputWidth"
              name="outputWidth"
              type="number"
              value={editableSettings.outputWidth}
              onChange={handleInputChange}
              disabled={isLoading}
              accentColorName={selectedAccentColorName}
              className="text-xs"
            />
            <TextInput
              label="Output (Scaled) Height"
              id="outputHeight"
              name="outputHeight"
              type="number"
              value={editableSettings.outputHeight}
              onChange={handleInputChange}
              disabled={isLoading}
              accentColorName={selectedAccentColorName}
              className="text-xs"
            />
            <TextInput
              label="FPS Numerator"
              id="fpsNumerator"
              name="fpsNumerator"
              type="number"
              value={editableSettings.fpsNumerator}
              onChange={handleInputChange}
              disabled={isLoading}
              accentColorName={selectedAccentColorName}
              className="text-xs"
            />
            <TextInput
              label="FPS Denominator"
              id="fpsDenominator"
              name="fpsDenominator"
              type="number"
              value={editableSettings.fpsDenominator}
              onChange={handleInputChange}
              disabled={isLoading}
              accentColorName={selectedAccentColorName}
              className="text-xs"
            />
          </div>
          <div className="mt-3 flex justify-end"> {/* Reduced mt */}
            <Button
              onClick={handleSaveChanges}
              isLoading={isLoading}
              disabled={isLoading}
              variant="primary"
              size="sm"
              title="Save current video settings to OBS"
              accentColorName={selectedAccentColorName}
            >
              Save Video Settings 💾
            </Button>
          </div>
          <p className="text-xs text-[var(--ctp-subtext0)] mt-1.5"> {/* Reduced mt */}
            Note: Modifying settings can impact OBS performance. Ensure values are valid. Some settings may require an OBS restart to take full effect (not handled by this UI).
          </p>
        </>
      ) : (
        <div className="flex justify-center items-center py-8"><LoadingSpinner size={8} /> <span className="ml-2 text-[var(--ctp-subtext0)]">Loading video settings...</span></div>
      )}
    </div>
  );
};
