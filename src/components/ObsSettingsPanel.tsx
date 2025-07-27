import { ColorChooser } from './common/ColorChooser';
import Tooltip from './ui/Tooltip';
import React, { useState } from 'react';
import { Modal } from './common/Modal';
import { CogIcon } from './common/CogIcon';
import { TextInput } from './common/TextInput';
import {
  CatppuccinAccentColorName,
  catppuccinAccentColorsHexMap,
  CatppuccinSecondaryAccentColorName,
  catppuccinSecondaryAccentColorsHexMap,
  CatppuccinChatBubbleColorName,
  catppuccinChatBubbleColorsHexMap
} from '../types';
import { ChatBubblePreview } from './common/ChatBubblePreview';
import { useSettingsStore } from '../store/settingsStore';
import { CollapsibleSection } from './common/CollapsibleSection';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';

interface ObsSettingsPanelActions {
  setThemeColor: (themeKey: 'accent' | 'secondaryAccent' | 'userChatBubble' | 'modelChatBubble', colorName: string) => void;
  toggleFlipSides: () => void;
  toggleAutoApplySuggestions: () => void;
  toggleExtraDarkMode: () => void;
  setCustomChatBackground: (url: string) => void;
  resetSettings?: () => void; // Optional, for demonstration
}

interface ObsSettingsPanelProps {
  selectedAccentColorName: CatppuccinAccentColorName;
  selectedSecondaryAccentColorName: CatppuccinSecondaryAccentColorName;
  selectedUserChatBubbleColorName: CatppuccinChatBubbleColorName;
  selectedModelChatBubbleColorName: CatppuccinChatBubbleColorName;
  flipSides: boolean;
  actions: ObsSettingsPanelActions;
}

export const ObsSettingsPanel: React.FC<ObsSettingsPanelProps> = ({
  selectedAccentColorName,
  selectedSecondaryAccentColorName,
  selectedUserChatBubbleColorName,
  selectedModelChatBubbleColorName,
  flipSides,
  actions
}) => {
  // Zustand selectors
const autoApplySuggestions = useSettingsStore(state => state.autoApplySuggestions);
const extraDarkMode = useSettingsStore(state => state.extraDarkMode);
const customChatBackground = useSettingsStore(state => state.customChatBackground);
const bubbleFillOpacity = useSettingsStore(state => state.bubbleFillOpacity);
const chatBubbleBlendMode = useSettingsStore(state => state.chatBubbleBlendMode);
const backgroundOpacity = useSettingsStore(state => state.backgroundOpacity);
const chatBackgroundBlendMode = useSettingsStore(state => state.chatBackgroundBlendMode);
const storeActions = useSettingsStore(state => state.actions);

  const [showResetModal, setShowResetModal] = useState(false);

  // Collapsible state for each section
  const [openTheme, setOpenTheme] = useState(true);
  const [openChat, setOpenChat] = useState(true);
  // Modal state for chat background settings
  const [showBgSettingsModal, setShowBgSettingsModal] = useState(false);
  // Modal state for chat bubble fill settings
  const [showBubbleSettingsModal, setShowBubbleSettingsModal] = useState(false);

  // Get accent color hex from Zustand
  const accentColor = catppuccinAccentColorsHexMap[selectedAccentColorName] || '#89b4fa';

  return (
    <div className="space-y-2 max-w-4xl mx-auto p-0">
      {/* Theme Section */}
      <CollapsibleSection
        isOpen={openTheme}
        onToggle={() => setOpenTheme(!openTheme)}
        title="Theme Settings"
        emoji="🎨"
        accentColor={accentColor}
      >
        <ColorChooser
          label="🎨 Primary Accent Color"
          onChange={(color) => storeActions.setThemeColor('accent', color)}
          colorsHexMap={catppuccinAccentColorsHexMap}
          selectedColorName={useSettingsStore(state => state.theme.accent)}
          themeKey="accent"
          colorNameTypeGuard={(name): name is CatppuccinAccentColorName => name in catppuccinAccentColorsHexMap}
        />
        <ColorChooser
          label="🎨 Secondary Accent Color"
          onChange={(color) => storeActions.setThemeColor('secondaryAccent', color)}
          colorsHexMap={catppuccinSecondaryAccentColorsHexMap}
          selectedColorName={useSettingsStore(state => state.theme.secondaryAccent)}
          themeKey="secondaryAccent"
          colorNameTypeGuard={(name): name is CatppuccinSecondaryAccentColorName => name in catppuccinSecondaryAccentColorsHexMap}
        />
      </CollapsibleSection>

      {/* Chat Bubble Section */}
      <CollapsibleSection
        isOpen={openChat}
        onToggle={() => setOpenChat(!openChat)}
        title="Chat Bubble Colors & Options"
        emoji="💬"
        accentColor={accentColor}
      >
        <ChatBubblePreview
          userColor={useSettingsStore(state => state.theme.userChatBubble)}
          modelColor={useSettingsStore(state => state.theme.modelChatBubble)}
          flipSides={useSettingsStore(state => state.flipSides)}
          extraDarkMode={useSettingsStore(state => state.extraDarkMode)}
          customBackground={useSettingsStore(state => state.customChatBackground)}
          bubbleFillOpacity={useSettingsStore(state => state.bubbleFillOpacity)}
          backgroundOpacity={useSettingsStore(state => state.backgroundOpacity)}
          chatBackgroundBlendMode={useSettingsStore(state => state.chatBackgroundBlendMode) as React.CSSProperties['mixBlendMode']}
          chatBubbleBlendMode={useSettingsStore(state => state.chatBubbleBlendMode) as React.CSSProperties['mixBlendMode']}
        />
        <div className="space-y-4">
          {/* User Chat Bubble Color with Opacity Slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-primary" style={{ color: catppuccinChatBubbleColorsHexMap[selectedUserChatBubbleColorName as CatppuccinChatBubbleColorName] }}>
                💬 User Chat Bubble Color
              </label>
              <div className="flex items-center space-x-2">
                <button
                  className="ml-1 p-1 rounded hover:bg-accent/20 transition-colors"
                  aria-label="Open chat bubble fill settings"
                  onClick={() => setShowBubbleSettingsModal(true)}
                >
                  <CogIcon className={cn("w-5 h-5", `text-[${accentColor}]`)} />
                </button>
              </div>
            </div>
            {/* Chat Bubble Fill Settings Modal */}
            <Modal
              title="Chat Bubble Fill Settings"
              isOpen={showBubbleSettingsModal}
              onClose={() => setShowBubbleSettingsModal(false)}
              accentColorName={selectedAccentColorName}
              size="sm"
            >
              <div className="flex flex-col gap-2 items-center py-2 w-56">
                <label className="text-xs font-medium text-primary flex items-center gap-2">
                  💬 Opacity
                  <span className="text-xs text-muted-foreground">({Math.round(bubbleFillOpacity * 100)}%)</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={bubbleFillOpacity}
                  onChange={e => storeActions.setBubbleFillOpacity(parseFloat(e.target.value))}
                  className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer"
                />
                <label className="text-xs font-medium text-primary flex items-center gap-2 mt-2">
                  🎨 Blend Mode
                </label>
                <select
                  value={chatBubbleBlendMode}
                  onChange={e => storeActions.setChatBubbleBlendMode(e.target.value)}
                  className="w-full p-1 rounded border border-border bg-background text-foreground text-xs"
                >
                  <option value="normal">Normal</option>
                  <option value="multiply">Multiply</option>
                  <option value="screen">Screen</option>
                  <option value="overlay">Overlay</option>
                  <option value="darken">Darken</option>
                  <option value="lighten">Lighten</option>
                  <option value="color-dodge">Color Dodge</option>
                  <option value="color-burn">Color Burn</option>
                  <option value="hard-light">Hard Light</option>
                  <option value="soft-light">Soft Light</option>
                  <option value="difference">Difference</option>
                  <option value="exclusion">Exclusion</option>
                  <option value="hue">Hue</option>
                  <option value="saturation">Saturation</option>
                  <option value="color">Color</option>
                  <option value="luminosity">Luminosity</option>
                </select>
              </div>
            </Modal>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(catppuccinChatBubbleColorsHexMap).map((colorNameIter) => (
                <button
                  key={colorNameIter}
                  title={colorNameIter.charAt(0).toUpperCase() + colorNameIter.slice(1)}
                  onClick={() => actions.setThemeColor('userChatBubble', colorNameIter)}
                  className={cn(
                    "w-5 h-5 rounded-full border-2 transition-all duration-150 focus:outline-none",
                    selectedUserChatBubbleColorName === colorNameIter
                      ? 'ring-2 ring-offset-2 ring-offset-background border-border'
                      : 'border-border hover:border-muted-foreground'
                  )}
                  style={{
                    backgroundColor: catppuccinChatBubbleColorsHexMap[colorNameIter as CatppuccinChatBubbleColorName],
                    borderColor: selectedUserChatBubbleColorName === colorNameIter ? catppuccinChatBubbleColorsHexMap[colorNameIter as CatppuccinChatBubbleColorName] : undefined
                  }}
                  aria-label={`Select ${colorNameIter} for user chat bubble`}
                />
              ))}
            </div>
          </div>

          {/* Model Chat Bubble Color with shared opacity slider */}
          <div>
            <label className="block text-sm font-medium mb-1 text-primary" style={{ color: catppuccinChatBubbleColorsHexMap[selectedModelChatBubbleColorName as CatppuccinChatBubbleColorName] }}>
              🤖 Model Chat Bubble Color
            </label>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(catppuccinChatBubbleColorsHexMap).map((colorNameIter) => (
                <button
                  key={colorNameIter}
                  title={colorNameIter.charAt(0).toUpperCase() + colorNameIter.slice(1)}
                  onClick={() => actions.setThemeColor('modelChatBubble', colorNameIter)}
                  className={cn(
                    "w-5 h-5 rounded-full border-2 transition-all duration-150 focus:outline-none",
                    selectedModelChatBubbleColorName === colorNameIter
                      ? 'ring-2 ring-offset-2 ring-offset-background border-border'
                      : 'border-border hover:border-muted-foreground'
                  )}
                  style={{
                    backgroundColor: catppuccinChatBubbleColorsHexMap[colorNameIter as CatppuccinChatBubbleColorName],
                    borderColor: selectedModelChatBubbleColorName === colorNameIter ? catppuccinChatBubbleColorsHexMap[colorNameIter as CatppuccinChatBubbleColorName] : undefined
                  }}
                  aria-label={`Select ${colorNameIter} for model chat bubble`}
                />
              ))}
            </div>
          </div>

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
            <div className="mt-2 flex items-center gap-2 relative">
              <TextInput
                label="Custom Chat Background URL"
                id="custom-chat-background"
                type="text"
                value={customChatBackground}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => actions.setCustomChatBackground(e.target.value)}
                placeholder="Enter a URL for a custom chat background"
                accentColorName={selectedAccentColorName}
              />
              {/* Paste/Clear button inside the field */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                {customChatBackground ? (
                  <button
                    type="button"
                    className="p-1 rounded hover:bg-accent/20 transition-colors"
                    aria-label="Clear chat background URL"
                    onClick={() => actions.setCustomChatBackground('')}
                    tabIndex={0}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="p-1 rounded hover:bg-accent/20 transition-colors"
                    aria-label="Paste from clipboard"
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText();
                        if (text) actions.setCustomChatBackground(text);
                      } catch (err) {
                        // Optionally show error
                      }
                    }}
                    tabIndex={0}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 17l4 4 4-4m-4-5v9" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12v7a2 2 0 01-2 2H6a2 2 0 01-2-2v-7" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 6V4a2 2 0 00-2-2H10a2 2 0 00-2 2v2" /></svg>
                  </button>
                )}
              </div>
              <button
                type="button"
                className="ml-1 p-1 rounded hover:bg-accent/20 transition-colors"
                aria-label="Open chat background settings"
                onClick={() => setShowBgSettingsModal(true)}
              >
                  <CogIcon className={cn("w-5 h-5", `text-[${accentColor}]`)} />
              </button>
            </div>
            {/* Chat Background Settings Modal */}
            <Modal
              title="Chat Background Settings"
              isOpen={showBgSettingsModal}
              onClose={() => setShowBgSettingsModal(false)}
              accentColorName={selectedAccentColorName}
              size="sm"
            >
              <div className="flex flex-col gap-2 items-center py-2 w-56">
                <label className="text-xs font-medium text-primary flex items-center gap-2">
                  🖼️ Opacity
                  <span className="text-xs text-muted-foreground">({Math.round(backgroundOpacity * 100)}%)</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={backgroundOpacity}
                  onChange={e => storeActions.setBackgroundOpacity(parseFloat(e.target.value))}
                  className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer"
                />
                <label className="text-xs font-medium text-primary flex items-center gap-2 mt-2">
                  🎨 Blend Mode
                </label>
                <select
                  value={chatBackgroundBlendMode}
                  onChange={e => storeActions.setChatBackgroundBlendMode(e.target.value)}
                  className="w-full p-1 rounded border border-border bg-background text-foreground text-xs"
                >
                  <option value="normal">Normal</option>
                  <option value="multiply">Multiply</option>
                  <option value="screen">Screen</option>
                  <option value="overlay">Overlay</option>
                  <option value="darken">Darken</option>
                  <option value="lighten">Lighten</option>
                  <option value="color-dodge">Color Dodge</option>
                  <option value="color-burn">Color Burn</option>
                  <option value="hard-light">Hard Light</option>
                  <option value="soft-light">Soft Light</option>
                  <option value="difference">Difference</option>
                  <option value="exclusion">Exclusion</option>
                  <option value="hue">Hue</option>
                  <option value="saturation">Saturation</option>
                  <option value="color">Color</option>
                  <option value="luminosity">Luminosity</option>
                </select>
              </div>
            </Modal>
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
};
