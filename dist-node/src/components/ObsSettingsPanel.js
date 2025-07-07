import { ColorChooser } from './common/ColorChooser';
import React, { useState } from 'react';
import { Modal } from './common/Modal';
import { CogIcon } from './common/CogIcon';
import { TextInput } from './common/TextInput';
import { catppuccinAccentColorsHexMap, catppuccinSecondaryAccentColorsHexMap, catppuccinChatBubbleColorsHexMap } from '../types';
import { ChatBubblePreview } from './common/ChatBubblePreview';
import { useAppStore } from '../store/appStore';
import { CollapsibleSection } from './common/CollapsibleSection';
import { Button } from './common/Button';
import { cn } from '../lib/utils';
export const ObsSettingsPanel = ({ selectedAccentColorName, selectedSecondaryAccentColorName, selectedUserChatBubbleColorName, selectedModelChatBubbleColorName, flipSides, actions }) => {
    // Zustand selectors
    const autoApplySuggestions = useAppStore(state => state.userSettings.autoApplySuggestions);
    const extraDarkMode = useAppStore(state => state.userSettings.extraDarkMode);
    const customChatBackground = useAppStore(state => state.userSettings.customChatBackground);
    const bubbleFillOpacity = useAppStore(state => state.userSettings.bubbleFillOpacity);
    const chatBubbleBlendMode = useAppStore(state => state.userSettings.chatBubbleBlendMode);
    const backgroundOpacity = useAppStore(state => state.userSettings.backgroundOpacity);
    const chatBackgroundBlendMode = useAppStore(state => state.userSettings.chatBackgroundBlendMode);
    const storeActions = useAppStore(state => state.actions);
    const [showResetModal, setShowResetModal] = useState(false);
    // Removed inline ColorChooser definition to avoid duplication
    // Collapsible state for each section
    const [openTheme, setOpenTheme] = useState(true);
    const [openChat, setOpenChat] = useState(true);
    // Modal state for chat background settings
    const [showBgSettingsModal, setShowBgSettingsModal] = useState(false);
    // Modal state for chat bubble fill settings
    const [showBubbleSettingsModal, setShowBubbleSettingsModal] = useState(false);
    // Get accent color hex from Zustand
    const accentColor = useAppStore(state => catppuccinAccentColorsHexMap[state.userSettings.theme.accent] || '#89b4fa');
    return (<div className="space-y-2 max-w-4xl mx-auto p-0">
      {/* Theme Section */}
    <div className="text-2xl font-bold mb-4" style={{
            color: accentColor,
            textShadow: `0 0 8px ${accentColor}, 0 0 16px ${accentColor}`,
            overflow: 'visible',
            whiteSpace: 'nowrap',
        }}>
  Theme Settings 🎨
    </div>
    <CollapsibleSection isOpen={openTheme} onToggle={() => setOpenTheme(!openTheme)} title="Theme Settings" emoji="🎨" accentColor={accentColor}>
        <ColorChooser label="🎨 Primary Accent Color" onChange={(color) => storeActions.setThemeColor('accent', color)} colorsHexMap={catppuccinAccentColorsHexMap} selectedColorName={useAppStore(state => state.userSettings.theme.accent)} themeKey="accent" colorNameTypeGuard={(name) => name in catppuccinAccentColorsHexMap}/>
        <ColorChooser label="🎨 Secondary Accent Color" onChange={(color) => storeActions.setThemeColor('secondaryAccent', color)} colorsHexMap={catppuccinSecondaryAccentColorsHexMap} selectedColorName={useAppStore(state => state.userSettings.theme.secondaryAccent)} themeKey="secondaryAccent" colorNameTypeGuard={(name) => name in catppuccinSecondaryAccentColorsHexMap}/>
      </CollapsibleSection>

      {/* Chat Bubble Section */}
      <CollapsibleSection isOpen={openChat} onToggle={() => setOpenChat(!openChat)} title="Chat Bubble Colors & Options" emoji="💬" accentColor={accentColor}>
    <ChatBubblePreview userColor={useAppStore(state => state.userSettings.theme.userChatBubble)} modelColor={useAppStore(state => state.userSettings.theme.modelChatBubble)} flipSides={useAppStore(state => state.userSettings.flipSides)} extraDarkMode={useAppStore(state => state.userSettings.extraDarkMode)} customBackground={useAppStore(state => state.userSettings.customChatBackground)} bubbleFillOpacity={useAppStore(state => state.userSettings.bubbleFillOpacity)} backgroundOpacity={useAppStore(state => state.userSettings.backgroundOpacity)} chatBackgroundBlendMode={useAppStore(state => state.userSettings.chatBackgroundBlendMode)} chatBubbleBlendMode={useAppStore(state => state.userSettings.chatBubbleBlendMode)}/>
        <div className="space-y-4">
          {/* User Chat Bubble Color with Opacity Slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-primary" style={{ color: catppuccinChatBubbleColorsHexMap[selectedUserChatBubbleColorName] }}>
                💬 User Chat Bubble Color
              </label>
              <div className="flex items-center space-x-2">
                <button className="ml-1 p-1 rounded hover:bg-accent/20 transition-colors" aria-label="Open chat bubble fill settings" onClick={() => setShowBubbleSettingsModal(true)}>
                  <CogIcon className="w-5 h-5 text-accent"/>
                </button>
              </div>
            </div>
            {/* Chat Bubble Fill Settings Modal */}
            <Modal title="Chat Bubble Fill Settings" isOpen={showBubbleSettingsModal} onClose={() => setShowBubbleSettingsModal(false)} accentColorName={selectedAccentColorName} size="sm">
              <div className="flex flex-col gap-2 items-center py-2 w-56">
                <label className="text-xs font-medium text-primary flex items-center gap-2">
                  💬 Opacity
                  <span className="text-xs text-muted-foreground">({Math.round(bubbleFillOpacity * 100)}%)</span>
                </label>
                <input type="range" min="0" max="1" step="0.05" value={bubbleFillOpacity} onChange={e => storeActions.setBubbleFillOpacity(parseFloat(e.target.value))} className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer"/>
                <label className="text-xs font-medium text-primary flex items-center gap-2 mt-2">
                  🎨 Blend Mode
                </label>
                <select value={chatBubbleBlendMode} onChange={e => storeActions.setChatBubbleBlendMode(e.target.value)} className="w-full p-1 rounded border border-border bg-background text-foreground text-xs">
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
              {Object.keys(catppuccinChatBubbleColorsHexMap).map((colorNameIter) => (<button key={colorNameIter} title={colorNameIter.charAt(0).toUpperCase() + colorNameIter.slice(1)} onClick={() => actions.setThemeColor('userChatBubble', colorNameIter)} className={cn("w-5 h-5 rounded-full border-2 transition-all duration-150 focus:outline-none", selectedUserChatBubbleColorName === colorNameIter
                ? 'ring-2 ring-offset-2 ring-offset-background border-border'
                : 'border-border hover:border-muted-foreground')} style={{
                backgroundColor: catppuccinChatBubbleColorsHexMap[colorNameIter],
                borderColor: selectedUserChatBubbleColorName === colorNameIter ? catppuccinChatBubbleColorsHexMap[colorNameIter] : undefined
            }} aria-label={`Select ${colorNameIter} for user chat bubble`}/>))}
            </div>
          </div>

          {/* Model Chat Bubble Color with shared opacity slider */}
          <div>
            <label className="block text-sm font-medium mb-1 text-primary" style={{ color: catppuccinChatBubbleColorsHexMap[selectedModelChatBubbleColorName] }}>
              🤖 Model Chat Bubble Color
            </label>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(catppuccinChatBubbleColorsHexMap).map((colorNameIter) => (<button key={colorNameIter} title={colorNameIter.charAt(0).toUpperCase() + colorNameIter.slice(1)} onClick={() => actions.setThemeColor('modelChatBubble', colorNameIter)} className={cn("w-5 h-5 rounded-full border-2 transition-all duration-150 focus:outline-none", selectedModelChatBubbleColorName === colorNameIter
                ? 'ring-2 ring-offset-2 ring-offset-background border-border'
                : 'border-border hover:border-muted-foreground')} style={{
                backgroundColor: catppuccinChatBubbleColorsHexMap[colorNameIter],
                borderColor: selectedModelChatBubbleColorName === colorNameIter ? catppuccinChatBubbleColorsHexMap[colorNameIter] : undefined
            }} aria-label={`Select ${colorNameIter} for model chat bubble`}/>))}
            </div>
          </div>

          <div className="space-y-2 mt-2 mb-2">
            <label className="flex items-center space-x-2 text-xs text-muted-foreground cursor-pointer group">
              <input type="checkbox" checked={flipSides} onChange={() => actions.toggleFlipSides()} className="appearance-none h-4 w-4 border-2 border-border rounded-sm bg-background
                         checked:bg-primary checked:border-transparent focus:outline-none 
                         focus:ring-2 focus:ring-offset-0 focus:ring-ring focus:ring-opacity-50
                         transition duration-150 group-hover:border-border"/>
              <span className="group-hover:text-foreground transition-colors duration-200 text-[0.97em]">
                <span className="mr-1">🔄</span>
                Flip assistant/user chat sides
              </span>
            </label>
            <label className="flex items-center space-x-2 text-xs text-muted-foreground cursor-pointer group">
              <input type="checkbox" checked={autoApplySuggestions} onChange={() => actions.toggleAutoApplySuggestions()} className="appearance-none h-4 w-4 border-2 border-border rounded-sm bg-background
                         checked:bg-primary checked:border-transparent focus:outline-none 
                         focus:ring-2 focus:ring-offset-0 focus:ring-ring focus:ring-opacity-50
                         transition duration-150 group-hover:border-border"/>
              <span className="group-hover:text-foreground transition-colors duration-200 text-[0.97em]">
                <span className="mr-1">⚡</span>
                Auto-apply chat suggestions <span className="text-muted-foreground">(send immediately when clicked)</span>
              </span>
            </label>
            <label className="flex items-center space-x-2 text-xs text-muted-foreground cursor-pointer group">
              <input type="checkbox" checked={extraDarkMode} onChange={() => actions.toggleExtraDarkMode()} className="appearance-none h-4 w-4 border-2 border-border rounded-sm bg-background
                         checked:bg-primary checked:border-transparent focus:outline-none 
                         focus:ring-2 focus:ring-offset-0 focus:ring-ring focus:ring-opacity-50
                         transition duration-150 group-hover:border-border"/>
              <span className="group-hover:text-foreground transition-colors duration-200 text-[0.97em]">
                <span className="mr-1">🌑</span>
                Extra Dark mode <span className="text-muted-foreground">(outlined chat bubbles)</span>
              </span>
            </label>
            <div className="mt-2 flex items-center gap-2 relative">
              <TextInput label="Custom Chat Background URL" id="custom-chat-background" type="text" value={customChatBackground} onChange={(e) => actions.setCustomChatBackground(e.target.value)} placeholder="Enter a URL for a custom chat background" accentColorName={selectedAccentColorName}/>
              {/* Paste/Clear button inside the field */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                {customChatBackground ? (<button type="button" className="p-1 rounded hover:bg-accent/20 transition-colors" aria-label="Clear chat background URL" onClick={() => actions.setCustomChatBackground('')} tabIndex={0}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>) : (<button type="button" className="p-1 rounded hover:bg-accent/20 transition-colors" aria-label="Paste from clipboard" onClick={async () => {
                try {
                    const text = await navigator.clipboard.readText();
                    if (text)
                        actions.setCustomChatBackground(text);
                }
                catch (err) {
                    // Optionally show error
                }
            }} tabIndex={0}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 17l4 4 4-4m-4-5v9"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12v7a2 2 0 01-2 2H6a2 2 0 01-2-2v-7"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 6V4a2 2 0 00-2-2H10a2 2 0 00-2 2v2"/></svg>
                  </button>)}
              </div>
              <button type="button" className="ml-1 p-1 rounded hover:bg-accent/20 transition-colors" aria-label="Open chat background settings" onClick={() => setShowBgSettingsModal(true)}>
                <CogIcon className="w-5 h-5 text-accent"/>
              </button>
            </div>

            {/* Chat Background Settings Modal */}
            <Modal title="Chat Background Settings" isOpen={showBgSettingsModal} onClose={() => setShowBgSettingsModal(false)} accentColorName={selectedAccentColorName} size="sm">
              <div className="flex flex-col gap-2 items-center py-2 w-56">
                <label className="text-xs font-medium text-primary flex items-center gap-2">
                  🖼️ Opacity
                  <span className="text-xs text-muted-foreground">({Math.round(backgroundOpacity * 100)}%)</span>
                </label>
                <input type="range" min="0" max="1" step="0.05" value={backgroundOpacity} onChange={e => storeActions.setBackgroundOpacity(parseFloat(e.target.value))} className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer"/>
                <label className="text-xs font-medium text-primary flex items-center gap-2 mt-2">
                  🎨 Blend Mode
                </label>
                <select value={chatBackgroundBlendMode} onChange={e => storeActions.setChatBackgroundBlendMode(e.target.value)} className="w-full p-1 rounded border border-border bg-background text-foreground text-xs">
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

      {/* Reset Section */}
      <div className="mt-8 flex justify-end">
        <Button variant="destructive" onClick={() => setShowResetModal(true)}>
          Reset Settings
        </Button>
      </div>
      <Modal title="Reset Settings" isOpen={showResetModal} onClose={() => setShowResetModal(false)} accentColorName={selectedAccentColorName} size="sm">
        <div className="flex flex-col gap-4 items-center py-2 w-64">
          <div className="text-center text-sm text-foreground">
            Are you sure you want to reset all settings? This action cannot be undone.
          </div>
          <div className="flex gap-2 justify-center">
            <Button variant="destructive" onClick={() => {
            setShowResetModal(false);
            actions.resetSettings && actions.resetSettings();
        }}>
              Yes, Reset
            </Button>
            <Button variant="secondary" onClick={() => setShowResetModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>);
};
