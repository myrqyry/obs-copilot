import React, { useState } from 'react';
import { TextInput } from './common/TextInput';
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

import { cn } from '../lib/utils';

interface ObsSettingsPanelProps {
  selectedAccentColorName: CatppuccinAccentColorName;
  selectedSecondaryAccentColorName: CatppuccinSecondaryAccentColorName;
  selectedUserChatBubbleColorName: CatppuccinChatBubbleColorName;
  selectedModelChatBubbleColorName: CatppuccinChatBubbleColorName;
  flipSides: boolean;
  actions: any;
}


export const ObsSettingsPanel: React.FC<ObsSettingsPanelProps> = ({
  selectedAccentColorName,
  selectedSecondaryAccentColorName,
  selectedUserChatBubbleColorName,
  selectedModelChatBubbleColorName,
  flipSides,
  actions
}) => {
  // Extract all Zustand selectors at the top
  const autoApplySuggestions = useAppStore(state => state.autoApplySuggestions);
  const extraDarkMode = useAppStore(state => state.extraDarkMode);
  const customChatBackground = useAppStore(state => state.customChatBackground);

  const ColorChooser: React.FC<{
    label: string;
    colorsHexMap: Record<string, string>;
    selectedColorName: string;
    themeKey: 'accent' | 'secondaryAccent' | 'userChatBubble' | 'modelChatBubble';
    colorNameTypeGuard: (name: string) => boolean;
  }> = ({ label, colorsHexMap, selectedColorName, themeKey, colorNameTypeGuard }) => (
    <div className="mb-2">
      <label className="block text-sm font-medium mb-1 text-primary">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {Object.keys(colorsHexMap).map((colorNameIter) => {
          if (!colorNameTypeGuard(colorNameIter)) return null;
          return (
            <button
              key={colorNameIter}
              title={colorNameIter.charAt(0).toUpperCase() + colorNameIter.slice(1)}
              onClick={() => actions.setThemeColor(themeKey, colorNameIter)}
              className={cn(
                "w-5 h-5 rounded-full border-2 transition-all duration-150 focus:outline-none",
                selectedColorName === colorNameIter
                  ? 'ring-2 ring-offset-2 ring-offset-background border-border'
                  : 'border-border hover:border-muted-foreground'
              )}
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

  // Collapsible state for each section
  const [openTheme, setOpenTheme] = useState(true);
  const [openChat, setOpenChat] = useState(true);
  const [openMemory, setOpenMemory] = useState(true);
  const [openReset, setOpenReset] = useState(false);

  // Memory context state
  const userDefinedContext = useAppStore(state => state.userDefinedContext);
  const [userInput, setUserInput] = useState('');

  return (
    <div className="border-border shadow-lg rounded-lg bg-card max-h-full overflow-y-auto p-1 text-[15px]">
      {/* Theme Section */}
      <div className="mb-2 border-b border-border last:border-b-0">
        <button
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted transition-colors rounded-t-lg group text-[1.08em]"
          onClick={() => setOpenTheme((v) => !v)}
          aria-expanded={openTheme}
        >
          <span className="text-primary font-semibold flex items-center gap-2 text-[1em]">🎨 Theme Settings</span>
          <span className="transition-transform duration-200 group-hover:text-primary">
            {openTheme ? '▲' : '▼'}
          </span>
        </button>
        {openTheme && (
          <div className="px-6 pb-4 pt-2 space-y-3 animate-fade-in">
            <ColorChooser
              label="🎨 Primary Accent Color"
              colorsHexMap={catppuccinAccentColorsHexMap}
              selectedColorName={selectedAccentColorName}
              themeKey="accent"
              colorNameTypeGuard={(name): name is CatppuccinAccentColorName => name in catppuccinAccentColorsHexMap}
            />
            <ColorChooser
              label="🎨 Secondary Accent Color"
              colorsHexMap={catppuccinSecondaryAccentColorsHexMap}
              selectedColorName={selectedSecondaryAccentColorName}
              themeKey="secondaryAccent"
              colorNameTypeGuard={(name): name is CatppuccinSecondaryAccentColorName => name in catppuccinSecondaryAccentColorsHexMap}
            />
          </div>
        )}
      </div>

      {/* Chat Bubble Section */}
      <div className="mb-2 border-b border-border last:border-b-0">
        <button
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted transition-colors group text-[1.08em]"
          onClick={() => setOpenChat((v) => !v)}
          aria-expanded={openChat}
        >
          <span className="text-primary font-semibold flex items-center gap-2 text-[1em]">💬 Chat Bubble Colors & Options</span>
          <span className="transition-transform duration-200 group-hover:text-primary">
            {openChat ? '▲' : '▼'}
          </span>
        </button>
        {openChat && (
          <div className="px-6 pb-4 pt-2 space-y-3 animate-fade-in">
            <ColorChooser
              label="💬 User Chat Bubble Color"
              colorsHexMap={catppuccinChatBubbleColorsHexMap}
              selectedColorName={selectedUserChatBubbleColorName}
              themeKey="userChatBubble"
              colorNameTypeGuard={(name): name is CatppuccinChatBubbleColorName => name in catppuccinChatBubbleColorsHexMap}
            />
            <ColorChooser
              label="🤖 Model Chat Bubble Color"
              colorsHexMap={catppuccinChatBubbleColorsHexMap}
              selectedColorName={selectedModelChatBubbleColorName}
              themeKey="modelChatBubble"
              colorNameTypeGuard={(name): name is CatppuccinChatBubbleColorName => name in catppuccinChatBubbleColorsHexMap}
            />
            <div className="space-y-2 mt-2 mb-2">
              <label className="flex items-center space-x-2 text-xs text-muted-foreground cursor-pointer group">
                <input
                  type="checkbox"
                  checked={flipSides}
                  onChange={() => actions.toggleFlipSides()}
                  className="appearance-none h-4 w-4 border-2 border-border rounded-sm bg-background
                             checked:bg-primary checked:border-transparent focus:outline-none 
                             focus:ring-2 focus:ring-offset-0 focus:ring-ring focus:ring-opacity-50
                             transition duration-150 group-hover:border-border"
                />
                <span className="group-hover:text-foreground transition-colors duration-200 text-[0.97em]">
                  <span className="mr-1">🔄</span>
                  Flip assistant/user chat sides
                </span>
              </label>
              <label className="flex items-center space-x-2 text-xs text-muted-foreground cursor-pointer group">
                <input
                  type="checkbox"
                  checked={autoApplySuggestions}
                  onChange={() => actions.toggleAutoApplySuggestions()}
                  className="appearance-none h-4 w-4 border-2 border-border rounded-sm bg-background
                             checked:bg-primary checked:border-transparent focus:outline-none 
                             focus:ring-2 focus:ring-offset-0 focus:ring-ring focus:ring-opacity-50
                             transition duration-150 group-hover:border-border"
                />
                <span className="group-hover:text-foreground transition-colors duration-200 text-[0.97em]">
                  <span className="mr-1">⚡</span>
                  Auto-apply chat suggestions <span className="text-muted-foreground">(send immediately when clicked)</span>
                </span>
              </label>
              <label className="flex items-center space-x-2 text-xs text-muted-foreground cursor-pointer group">
                <input
                  type="checkbox"
                  checked={extraDarkMode}
                  onChange={() => actions.toggleExtraDarkMode()}
                  className="appearance-none h-4 w-4 border-2 border-border rounded-sm bg-background
                             checked:bg-primary checked:border-transparent focus:outline-none 
                             focus:ring-2 focus:ring-offset-0 focus:ring-ring focus:ring-opacity-50
                             transition duration-150 group-hover:border-border"
                />
                <span className="group-hover:text-foreground transition-colors duration-200 text-[0.97em]">
                  <span className="mr-1">🌑</span>
                  Extra Dark mode <span className="text-muted-foreground">(outlined chat bubbles)</span>
                </span>
              </label>
              <div className="mt-2">
                <TextInput
                  label="Custom Chat Background URL"
                  id="custom-chat-background"
                  type="text"
                  value={customChatBackground}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => actions.setCustomChatBackground(e.target.value)}
                  placeholder="Enter a URL for a custom chat background"
                  accentColorName={selectedAccentColorName}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Memory Context Section */}
      <div className="mb-2 border-b border-border last:border-b-0">
        <button
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted transition-colors group text-[1.08em]"
          onClick={() => setOpenMemory((v) => !v)}
          aria-expanded={openMemory}
        >
          <span className="text-primary font-semibold flex items-center gap-2 text-[1em]">🧠 Memory Context</span>
          <span className="transition-transform duration-200 group-hover:text-primary">
            {openMemory ? '▲' : '▼'}
          </span>
        </button>
        {openMemory && (
          <div className="px-6 pb-4 pt-2 space-y-3 animate-fade-in">
            <p className="text-[0.93em] text-muted-foreground mb-3">
              Add custom context that will be included with all Gemini conversations. Great for streaming details, community info, or personal preferences.
            </p>
            <div className="flex gap-2">
              <TextInput
                label=""
                id="memory-context-input"
                type="text"
                value={userInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserInput(e.target.value)}
                placeholder="Enter stream/community details"
                accentColorName={selectedAccentColorName}
              />
              <Button
                onClick={() => {
                  if (userInput.trim()) {
                    actions.addToUserDefinedContext(userInput.trim());
                    setUserInput('');
                  }
                }}
                disabled={!userInput.trim()}
                size="sm"
                accentColorName={selectedAccentColorName}
                className="mt-1"
              >
                Add
              </Button>
            </div>
            {userDefinedContext.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-primary">Current Context:</label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {userDefinedContext.map((context, index) => (
                    <div key={index} className="flex items-center justify-between bg-muted/30 px-3 py-2 rounded text-sm">
                      <span className="text-foreground flex-1 mr-2">{context}</span>
                      <Button
                        onClick={() => actions.removeFromUserDefinedContext(context)}
                        variant="danger"
                        size="sm"
                        accentColorName={selectedAccentColorName}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all memory context?')) {
                      actions.clearUserDefinedContext();
                    }
                  }}
                  variant="secondary"
                  size="sm"
                  accentColorName={selectedAccentColorName}
                >
                  Clear All Context
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reset Section */}
      <div className="mb-2">
        <button
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted transition-colors group rounded-b-lg text-[1.08em]"
          onClick={() => setOpenReset((v) => !v)}
          aria-expanded={openReset}
        >
          <span className="text-primary font-semibold flex items-center gap-2 text-[1em]">🔄 Reset Settings</span>
          <span className="transition-transform duration-200 group-hover:text-primary">
            {openReset ? '▲' : '▼'}
          </span>
        </button>
        {openReset && (
          <div className="px-6 pb-4 pt-2 animate-fade-in">
            <p className="text-[0.93em] text-muted-foreground mb-3">
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
        )}
      </div>
    </div>
  );
};
