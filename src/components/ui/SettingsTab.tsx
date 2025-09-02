import React from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { ThemeChooser } from '@/components/common/ThemeChooser';
import { ColorChooser } from '@/components/common/ColorChooser';
import { ChatBubblePreview } from '@/components/common/ChatBubblePreview';
import {
    CatppuccinAccentColorName,
    CatppuccinChatBubbleColorName,
    catppuccinAccentColorsHexMap,
    catppuccinChatBubbleColorsHexMap,
} from '@/types/themes';
import { CustomButton as Button } from '@/components/ui/CustomButton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

const blendModes = ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity'];

const SettingsTab: React.FC = () => {
    // Get all state values and actions in a single call
    const {
        flipSides,
        autoApplySuggestions,
        extraDarkMode,
        customChatBackground,
        bubbleFillOpacity,
        backgroundOpacity,
        chatBackgroundBlendMode,
        chatBubbleBlendMode,
        obsUrl,
        obsPassword,
        currentTheme,
        theme,
        actions: {
            toggleFlipSides,
            toggleAutoApplySuggestions,
            toggleExtraDarkMode,
            setCustomChatBackground,
            setBubbleFillOpacity,
            setBackgroundOpacity,
            setChatBackgroundBlendMode,
            setChatBubbleBlendMode,
            setObsUrl,
            setObsPassword,
            setThemeColor,
            setCurrentTheme,
        }
    } = useSettingsStore();

    const isCatppuccinAccentColorName = (name: string): name is CatppuccinAccentColorName => {
        return Object.keys(catppuccinAccentColorsHexMap).includes(name);
    };

    const isCatppuccinChatBubbleColorName = (name: string): name is CatppuccinChatBubbleColorName => {
        return Object.keys(catppuccinChatBubbleColorsHexMap).includes(name);
    };

    return (
        <div className="space-y-6 p-4">
            <h2 className="text-2xl font-bold text-primary">Settings</h2>

            {/* Theme Settings */}
            <section className="space-y-4">
                <h3 className="text-xl font-semibold text-secondary-foreground">Theme & Appearance</h3>
                <ThemeChooser />

                {/* Theme Selector */}
                <div className="flex items-center justify-between">
                    <Label>Interface Theme</Label>
                    <div className="flex space-x-2">
                        <Button
                            onClick={() => setCurrentTheme('light')}
                            variant={currentTheme === 'light' ? 'default' : 'outline'}
                        >
                            Light
                        </Button>
                        <Button
                            onClick={() => setCurrentTheme('dark')}
                            variant={currentTheme === 'dark' ? 'default' : 'outline'}
                        >
                            Dark
                        </Button>
                        <Button
                            onClick={() => setCurrentTheme('system')}
                            variant={currentTheme === 'system' ? 'default' : 'outline'}
                        >
                            System
                        </Button>
                    </div>
                </div>

                <ColorChooser
                    label="Accent Color"
                    colorsHexMap={catppuccinAccentColorsHexMap}
                    selectedColorName={theme.accent}
                    colorNameTypeGuard={isCatppuccinAccentColorName}
                    onChange={(color) => { if (typeof setThemeColor === 'function') { setThemeColor('accent', color as CatppuccinAccentColorName); } }}
                />

                <ColorChooser
                    label="Secondary Accent Color"
                    colorsHexMap={catppuccinAccentColorsHexMap}
                    selectedColorName={theme.secondaryAccent}
                    colorNameTypeGuard={isCatppuccinAccentColorName}
                    onChange={(color) => { if (typeof setThemeColor === 'function') { setThemeColor('secondaryAccent', color as CatppuccinAccentColorName); } }}
                />

                <div className="flex items-center justify-between">
                    <Label htmlFor="extra-dark-mode">Extra Dark Mode</Label>
                    <Switch
                        id="extra-dark-mode"
                        checked={extraDarkMode}
                        onCheckedChange={toggleExtraDarkMode}
                    />
                </div>
            </section>

            {/* Chat Bubble Customization */}
            <section className="space-y-4">
                <h3 className="text-xl font-semibold text-secondary-foreground">Chat Bubble Customization</h3>

                <ChatBubblePreview
                    userColor={theme.userChatBubble}
                    modelColor={theme.modelChatBubble}
                    flipSides={flipSides}
                    extraDarkMode={extraDarkMode}
                    customBackground={customChatBackground}
                    bubbleFillOpacity={bubbleFillOpacity}
                    backgroundOpacity={backgroundOpacity}
                    chatBackgroundBlendMode={chatBackgroundBlendMode as React.CSSProperties['mixBlendMode']}
                    chatBubbleBlendMode={chatBubbleBlendMode as React.CSSProperties['mixBlendMode']}
                />

                <ColorChooser
                    label="User Chat Bubble Color"
                    colorsHexMap={catppuccinChatBubbleColorsHexMap}
                    selectedColorName={theme.userChatBubble}
                    colorNameTypeGuard={isCatppuccinChatBubbleColorName}
                    onChange={(color) => { if (typeof setThemeColor === 'function') { setThemeColor('userChatBubble', color as CatppuccinChatBubbleColorName); } }}
                />

                <ColorChooser
                    label="Model Chat Bubble Color"
                    colorsHexMap={catppuccinChatBubbleColorsHexMap}
                    selectedColorName={theme.modelChatBubble}
                    colorNameTypeGuard={isCatppuccinChatBubbleColorName}
                    onChange={(color) => { if (typeof setThemeColor === 'function') { setThemeColor('modelChatBubble', color as CatppuccinChatBubbleColorName); } }}
                />

                <div className="space-y-2">
                    <Label htmlFor="bubble-fill-opacity">Bubble Fill Opacity ({Math.round(bubbleFillOpacity * 100)}%)</Label>
                    <Slider
                        id="bubble-fill-opacity"
                        min={0}
                        max={1}
                        step={0.01}
                        value={[bubbleFillOpacity]}
                        onValueChange={([value]: number[]) => setBubbleFillOpacity(value)}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <Label htmlFor="flip-sides">Flip Chat Bubble Sides</Label>
                    <Switch
                        id="flip-sides"
                        checked={flipSides}
                        onCheckedChange={toggleFlipSides}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="chat-bubble-blend-mode">Chat Bubble Blend Mode</Label>
                    <Select
                        value={chatBubbleBlendMode}
                        onValueChange={setChatBubbleBlendMode}
                    >
                        <SelectTrigger id="chat-bubble-blend-mode">
                            <SelectValue placeholder="Select blend mode" />
                        </SelectTrigger>
                        <SelectContent>
                            {blendModes.map(mode => (
                                <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </section>

            {/* Background Customization */}
            <section className="space-y-4">
                <h3 className="text-xl font-semibold text-secondary-foreground">Chat Background</h3>
                <div className="space-y-2">
                    <Label htmlFor="custom-background-url">Custom Background Image URL</Label>
                    <Input
                        id="custom-background-url"
                        type="text"
                        value={customChatBackground}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomChatBackground(e.target.value)}
                        placeholder="e.g., https://example.com/image.jpg"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="background-opacity">Background Image Opacity ({Math.round(backgroundOpacity * 100)}%)</Label>
                    <Slider
                        id="background-opacity"
                        min={0}
                        max={1}
                        step={0.01}
                        value={[backgroundOpacity]}
                        onValueChange={([value]: number[]) => setBackgroundOpacity(value)}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="chat-background-blend-mode">Chat Background Blend Mode</Label>
                    <Select
                        value={chatBackgroundBlendMode}
                        onValueChange={setChatBackgroundBlendMode}
                    >
                        <SelectTrigger id="chat-background-blend-mode">
                            <SelectValue placeholder="Select blend mode" />
                        </SelectTrigger>
                        <SelectContent>
                            {blendModes.map(mode => (
                                <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </section>

            {/* Other Settings */}
            <section className="space-y-4">
                <h3 className="text-xl font-semibold text-secondary-foreground">Other Settings</h3>
                <div className="flex items-center justify-between">
                    <Label htmlFor="auto-apply-suggestions">Auto-apply Suggestions</Label>
                    <Switch
                        id="auto-apply-suggestions"
                        checked={autoApplySuggestions}
                        onCheckedChange={toggleAutoApplySuggestions}
                    />
                </div>
            </section>

            {/* OBS Connection Settings */}
            <section className="space-y-4">
                <h3 className="text-xl font-semibold text-secondary-foreground">OBS Connection</h3>
                <div className="space-y-2">
                    <Label htmlFor="obs-url">OBS URL</Label>
                    <Input
                        id="obs-url"
                        type="text"
                        value={obsUrl}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setObsUrl(e.target.value)}
                        placeholder="e.g., ws://localhost:4455"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="obs-password">OBS Password</Label>
                    <Input
                        id="obs-password"
                        type="password"
                        value={obsPassword}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setObsPassword(e.target.value)}
                        placeholder="Optional password"
                    />
                </div>
            </section>
        </div>
    );
};

export default SettingsTab;
