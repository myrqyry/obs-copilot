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
import { ChatBubblePreview } from './common/ChatBubblePreview';
import { useAppStore } from '../store/appStore';
import { clearAllSettings } from '../utils/persistence';
import { Card, CardContent } from './ui';
import { cn } from '../lib/utils';


interface ObsSettingsPanelProps {
  selectedAccentColorName: CatppuccinAccentColorName;
  selectedSecondaryAccentColorName: CatppuccinSecondaryAccentColorName;
  selectedUserChatBubbleColorName: CatppuccinChatBubbleColorName;
  selectedModelChatBubbleColorName: CatppuccinChatBubbleColorName;
  flipSides: boolean;
  actions: any;
  hideMemoryAndReset?: boolean;
}


export const ObsSettingsPanel: React.FC<ObsSettingsPanelProps> = ({
  selectedAccentColorName,
  selectedSecondaryAccentColorName,
  selectedUserChatBubbleColorName,
  selectedModelChatBubbleColorName,
  flipSides,
  actions,
  hideMemoryAndReset
}) => {
  // Extract all Zustand selectors at the top
  const autoApplySuggestions = useAppStore(state => state.autoApplySuggestions);
  const extraDarkMode = useAppStore(state => state.extraDarkMode);
  const customChatBackground = useAppStore(state => state.customChatBackground);
  const bubbleFillOpacity = useAppStore(state => state.bubbleFillOpacity);
  const backgroundOpacity = useAppStore(state => state.backgroundOpacity);
  const storeActions = useAppStore(state => state.actions);

  const ColorChooser: React.FC<{
    label: string;
    colorsHexMap: Record<string, string>;
    selectedColorName: string;
    themeKey: 'accent' | 'secondaryAccent' | 'userChatBubble' | 'modelChatBubble';
    colorNameTypeGuard: (name: string) => boolean;
  }> = ({ label, colorsHexMap, selectedColorName, themeKey, colorNameTypeGuard }) => {
    // If this is a chat bubble color, use the selected color for the label
    const isUser = themeKey === 'userChatBubble';
    const isModel = themeKey === 'modelChatBubble';
    const colorStyle = (isUser || isModel) && selectedColorName in colorsHexMap
      ? { color: colorsHexMap[selectedColorName] }
      : {};
    return (
      <div className="mb-2">
        <label className="block text-sm font-medium mb-1 text-primary" style={colorStyle}>{label}</label>
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
  };

  // Collapsible state for each section
  const [openTheme, setOpenTheme] = useState(true);
  const [openChat, setOpenChat] = useState(true);
  const [openMemory, setOpenMemory] = useState(true);
  const [openReset, setOpenReset] = useState(false);

  // Memory context state
  const userDefinedContext = useAppStore(state => state.userDefinedContext);
  const [userInput, setUserInput] = useState('');

  return (
    <div className="space-y-3 max-w-4xl mx-auto">
      {/* Theme Section */}
      <Card className="border-border">
        <button
          className="w-full p-1.5 flex items-center justify-between text-left hover:bg-muted transition-colors rounded-t-lg group"
          onClick={() => setOpenTheme((v) => !v)}
          aria-expanded={openTheme}
        >
          <div className="flex items-center space-x-2">
            <span className="emoji text-sm">🎨</span>
            <span className="text-sm font-semibold text-foreground">Theme Settings</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">
              {openTheme ? 'Hide' : 'Show'} options
            </span>
            <svg
              className={cn(
                "w-4 h-4 text-muted-foreground transition-transform duration-200",
                openTheme ? 'rotate-180' : ''
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {openTheme && (
          <CardContent className="px-3 pb-3">
            <div className="space-y-4">
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
          </CardContent>
        )}
      </Card>

      {/* Chat Bubble Section */}
      <Card className="border-border">
        <button
          className="w-full p-1.5 flex items-center justify-between text-left hover:bg-muted transition-colors rounded-t-lg group"
          onClick={() => setOpenChat((v) => !v)}
          aria-expanded={openChat}
        >
          <div className="flex items-center space-x-2">
            <span className="emoji text-sm">💬</span>
            <span className="text-sm font-semibold text-foreground">Chat Bubble Colors & Options</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">
              {openChat ? 'Hide' : 'Show'} options
            </span>
            <svg
              className={cn(
                "w-4 h-4 text-muted-foreground transition-transform duration-200",
                openChat ? 'rotate-180' : ''
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {openChat && (
          <CardContent className="px-3 pb-3">
            <ChatBubblePreview
              userColor={selectedUserChatBubbleColorName}
              modelColor={selectedModelChatBubbleColorName}
              flipSides={flipSides}
              extraDarkMode={extraDarkMode}
              customBackground={customChatBackground}
              bubbleFillOpacity={bubbleFillOpacity}
              backgroundOpacity={backgroundOpacity}
            />
            <div className="space-y-4">
              {/* User Chat Bubble Color with Opacity Slider */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-primary" style={{ color: catppuccinChatBubbleColorsHexMap[selectedUserChatBubbleColorName as CatppuccinChatBubbleColorName] }}>
                    💬 User Chat Bubble Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">Fill:</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={bubbleFillOpacity}
                      onChange={(e) => storeActions.setBubbleFillOpacity(parseFloat(e.target.value))}
                      className="w-16 h-1 bg-border rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xs text-muted-foreground w-8 text-right">{Math.round(bubbleFillOpacity * 100)}%</span>
                  </div>
                </div>
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

              {/* Background Opacity Slider */}
              <div className="flex items-center justify-between py-2">
                <label className="text-sm font-medium text-primary">
                  🖼️ Background Opacity
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={backgroundOpacity}
                    onChange={(e) => storeActions.setBackgroundOpacity(parseFloat(e.target.value))}
                    className="w-20 h-1 bg-border rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs text-muted-foreground w-8 text-right">{Math.round(backgroundOpacity * 100)}%</span>
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
          </CardContent>
        )}
      </Card>

      {/* Memory Context Section */}
      {typeof hideMemoryAndReset === 'undefined' || !hideMemoryAndReset ? (
        <>
          <Card className="border-border">
            <button
              className="w-full p-1.5 flex items-center justify-between text-left hover:bg-muted transition-colors rounded-t-lg group"
              onClick={() => setOpenMemory((v) => !v)}
              aria-expanded={openMemory}
            >
              <div className="flex items-center space-x-2">
                <span className="emoji text-sm">🧠</span>
                <span className="text-sm font-semibold text-foreground">Memory Context</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-muted-foreground">
                  {openMemory ? 'Hide' : 'Show'} options
                </span>
                <svg
                  className={cn(
                    "w-4 h-4 text-muted-foreground transition-transform duration-200",
                    openMemory ? 'rotate-180' : ''
                  )}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {openMemory && (
              <CardContent className="px-3 pb-3">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
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
              </CardContent>
            )}
          </Card>

          {/* Reset Section */}
          <Card className="border-border">
            <button
              className="w-full p-1.5 flex items-center justify-between text-left hover:bg-muted transition-colors rounded-t-lg group"
              onClick={() => setOpenReset((v) => !v)}
              aria-expanded={openReset}
            >
              <div className="flex items-center space-x-2">
                <span className="emoji text-sm">🔄</span>
                <span className="text-sm font-semibold text-foreground">Reset Settings</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-muted-foreground">
                  {openReset ? 'Hide' : 'Show'} options
                </span>
                <svg
                  className={cn(
                    "w-4 h-4 text-muted-foreground transition-transform duration-200",
                    openReset ? 'rotate-180' : ''
                  )}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {openReset && (
              <CardContent className="px-3 pb-3">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
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
              </CardContent>
            )}
          </Card>
        </>
      ) : null}
    </div>
  );
};
