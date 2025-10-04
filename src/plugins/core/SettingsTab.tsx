import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import useSettingsStore from '../../store/settingsStore';
import { useOverlaysStore } from '../../store/overlaysStore';
import { CollapsibleCard } from '@/components/common/CollapsibleCard';
import { ThemeChooser } from '@/components/common/ThemeChooser';
import { ColorChooser } from '@/components/common/ColorChooser';
import { useTheme } from '@/hooks/useTheme';
import { ChatBubblePreview } from '@/components/common/ChatBubblePreview';
import { CatppuccinAccentColorName } from '@/types';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import type { ChatBackgroundType, ChatPattern, PatternName } from '@/types/chatBackground';
import { generatePatternCSS } from '@/lib/backgroundPatterns';

const SettingsTab: React.FC = () => {
    const {
        flipSides,
        setFlipSides,
        theme: currentTheme,
        setAccent,
        setSecondaryAccent,
        setCustomChatBackground,
        setChatBackgroundType,
        setChatPattern,
        chatBackgroundType,
        customChatBackground,
        chatPattern,
    twitchChatPluginEnabled,
    setTwitchChatPluginEnabled,
    automationPluginEnabled,
    setAutomationPluginEnabled,
    streamingAssetsPluginEnabled,
    setStreamingAssetsPluginEnabled,
    createPluginEnabled,
    setCreatePluginEnabled,
    setUserChatBubble,
    setModelChatBubble,
    extraDarkMode,
    setExtraDarkMode,
    // preview-related settings (restored)
    bubbleFillOpacity,
    chatBubbleBlendMode,

    } = useSettingsStore();
    const { regenerateChatOverlay } = useOverlaysStore();
    const { theme } = useTheme();

    const [openUIPreferences, setOpenUIPreferences] = useState(true);
    const [openChatBubbles, setOpenChatBubbles] = useState(true);
    const [openPlugins, setOpenPlugins] = useState(true);

    // Type guard for available accent colors in current theme
    const isValidAccentColor = (name: string): name is CatppuccinAccentColorName => {
        return Object.keys(theme?.accentColors || {}).includes(name);
    };

    const handlePrimaryColorChange = (color: string) => {
        setAccent(color as CatppuccinAccentColorName);
    };

    const handleSecondaryColorChange = (color: string) => {
        setSecondaryAccent(color as CatppuccinAccentColorName);
    };

    const handleUserChatBubbleChange = (color: string) => {
        setUserChatBubble(color);
    };

    const handleModelChatBubbleChange = (color: string) => {
        setModelChatBubble(color);
    };

    const handleRegenerateOverlay = async () => {
        try {
            await regenerateChatOverlay();
        } catch (error) {
            console.error('Failed to regenerate chat overlay:', error);
        }
    };

    console.log('SettingsTab rendering sections:', { openUIPreferences, openChatBubbles, openPlugins, twitchChatPluginEnabled });

    return (
        <div className="space-y-4 p-4">
            {/* Combined Theme & Colors Section */}
            <CollapsibleCard title="Theme & Colors 🎨" isOpen={openUIPreferences} onToggle={() => setOpenUIPreferences(!openUIPreferences)}>
                <div className="space-y-3">
                    {/* Base Theme Chooser (compact) */}
                    <div className="mb-2">
                        <ThemeChooser />
                    </div>

                    {/* Accent Colors (compact) */}
                    {theme?.accentColors && (
                        <div>
                            <div className="flex gap-4 items-start">
                                <div className="flex-1 space-y-3">
                                    <ColorChooser
                                        label="Primary Accent"
                                        colorsHexMap={theme.accentColors}
                                        selectedColorName={currentTheme.accent}
                                        colorNameTypeGuard={isValidAccentColor}
                                        onChange={handlePrimaryColorChange}
                                    />
                                    <ColorChooser
                                        label="Secondary Accent"
                                        colorsHexMap={theme.accentColors}
                                        selectedColorName={currentTheme.secondaryAccent}
                                        colorNameTypeGuard={isValidAccentColor}
                                        onChange={handleSecondaryColorChange}
                                    />
                                </div>

                                {/* Accent preview removed (kept controls only) */}
                            </div>
                        </div>
                    )}
                </div>
            </CollapsibleCard>

            {/* Chat Bubbles Section */}
            <CollapsibleCard title="Chat Bubbles 💬" isOpen={openChatBubbles} onToggle={() => setOpenChatBubbles(!openChatBubbles)}>
                <div className="space-y-4">
                    {theme?.accentColors && (
                            <div className="flex gap-6 items-stretch">
                            <div className="flex-1 space-y-4">
                                {/* Left column: all options */}
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="flip-sides">Swap Chat Sides</Label>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                id="flip-sides"
                                                checked={flipSides}
                                                onCheckedChange={(val: boolean) => setFlipSides(!!val)}
                                            />
                                            <span className="text-sm">{flipSides ? 'Left' : 'Right'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Label htmlFor="dark-bubbles" className="text-sm">Dark bubbles</Label>
                                            <Switch
                                                id="dark-bubbles"
                                                checked={extraDarkMode}
                                                onCheckedChange={(val: boolean) => setExtraDarkMode(!!val)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <ColorChooser
                                    label="User Chat Bubble Color"
                                    colorsHexMap={theme.accentColors}
                                    selectedColorName={currentTheme.userChatBubble}
                                    colorNameTypeGuard={isValidAccentColor}
                                    onChange={handleUserChatBubbleChange}
                                />
                                <ColorChooser
                                    label="Model Chat Bubble Color"
                                    colorsHexMap={theme.accentColors}
                                    selectedColorName={currentTheme.modelChatBubble}
                                    colorNameTypeGuard={isValidAccentColor}
                                    onChange={handleModelChatBubbleChange}
                                />

                                {/* Chat Background */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Chat Background Type</Label>
                                    <RadioGroup value={chatBackgroundType} onValueChange={(value: ChatBackgroundType) => setChatBackgroundType(value)}>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="image" id="bg-image" />
                                            <Label htmlFor="bg-image">Image</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="css" id="bg-css" />
                                            <Label htmlFor="bg-css">CSS Pattern</Label>
                                        </div>
                                    </RadioGroup>

                                    {chatBackgroundType === 'image' && (
                                        <>
                                            <Label className="text-sm font-medium">Chat Background Image</Label>
                                            <div className="space-y-2">
                                                <Input
                                                    type="url"
                                                    placeholder="Enter image URL (e.g., https://example.com/bg.jpg)"
                                                    value={customChatBackground || ''}
                                                    onChange={(e) => setCustomChatBackground(e.target.value)}
                                                    className="w-full"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        id="file-upload"
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                const reader = new FileReader();
                                                                reader.onload = (ev) => {
                                                                    setCustomChatBackground(ev.target?.result as string);
                                                                };
                                                                reader.readAsDataURL(file);
                                                            }
                                                        }}
                                                        className="flex-1"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setCustomChatBackground('')}
                                                    >
                                                        Clear
                                                    </Button>
                                                </div>
                                                {customChatBackground && (
                                                    <div className="text-xs text-muted-foreground">
                                                        {customChatBackground.startsWith('data:') ? 'Local file loaded' : 'URL set'}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
{chatBackgroundType === 'css' && chatPattern && (
    <div className="space-y-3">
        <div className="space-y-2">
            <Label className="text-sm font-medium">Pattern</Label>
            <Select value={chatPattern.name} onValueChange={(value: PatternName) => setChatPattern({ ...chatPattern, name: value })}>
                <SelectTrigger>
                    <SelectValue placeholder="Select pattern" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="wavy">Wavy</SelectItem>
                    <SelectItem value="rhombus">Rhombus</SelectItem>
                    <SelectItem value="zigzag">ZigZag</SelectItem>
                    <SelectItem value="circles">Circles</SelectItem>
                    <SelectItem value="lines">Lines</SelectItem>
                    <SelectItem value="triangle">Triangle</SelectItem>
                    <SelectItem value="boxes">Boxes</SelectItem>
                    <SelectItem value="polka">Polka</SelectItem>
                    <SelectItem value="diagonal">Diagonal</SelectItem>
                    <SelectItem value="isometric">Isometric</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label className="text-xs">Back Color</Label>
                <Input
                    type="color"
                    value={chatPattern.backColor}
                    onChange={(e) => setChatPattern({ ...chatPattern, backColor: e.target.value })}
                    className="w-full h-10"
                />
            </div>
            <div className="space-y-2">
                <Label className="text-xs">Front Color</Label>
                <Input
                    type="color"
                    value={chatPattern.frontColor}
                    onChange={(e) => setChatPattern({ ...chatPattern, frontColor: e.target.value })}
                    className="w-full h-10"
                />
            </div>
        </div>
        <div>
            <Label className="text-sm font-medium">Opacity</Label>
            <Slider
                value={[chatPattern.opacity]}
                onValueChange={(value) => setChatPattern({ ...chatPattern, opacity: value[0] })}
                min={0}
                max={1}
                step={0.01}
            />
            <div className="text-xs text-muted-foreground">
                {chatPattern.opacity}
            </div>
        </div>
        <div>
            <Label className="text-sm font-medium">Spacing</Label>
            <Input
                type="text"
                placeholder="100px"
                value={chatPattern.spacing}
                onChange={(e) => setChatPattern({ ...chatPattern, spacing: e.target.value })}
                className="w-full"
            />
        </div>
    </div>
)}
</div>
<Button onClick={handleRegenerateOverlay} className="w-full">
Regenerate Chat Overlay for OBS
</Button>
</div>

                            {/* Right column preview (restored) */}
                            <div className="flex-shrink-0 w-80 md:w-96 flex flex-col">
                                <ChatBubblePreview
                                    userColor={currentTheme.userChatBubble}
                                    modelColor={currentTheme.modelChatBubble}
                                    flipSides={flipSides}
                                    extraDarkMode={extraDarkMode}
                                    customBackground={customChatBackground}
                                    bubbleFillOpacity={bubbleFillOpacity}
                                    secondaryAccent={currentTheme.secondaryAccent}
                                    chatBubbleBlendMode={chatBubbleBlendMode as React.CSSProperties['mixBlendMode']}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </CollapsibleCard>

            {/* Plugins Section */}
            <CollapsibleCard title="Plugins 🧩" isOpen={openPlugins} onToggle={() => setOpenPlugins(!openPlugins)}>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="twitch-chat-plugin">Twitch Chat</Label>
                        <Switch
                            id="twitch-chat-plugin"
                            checked={twitchChatPluginEnabled}
                            onCheckedChange={setTwitchChatPluginEnabled}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="automation-plugin">Automation</Label>
                        <Switch
                            id="automation-plugin"
                            checked={automationPluginEnabled}
                            onCheckedChange={setAutomationPluginEnabled}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="streaming-assets-plugin">Streaming Assets</Label>
                        <Switch
                            id="streaming-assets-plugin"
                            checked={streamingAssetsPluginEnabled}
                            onCheckedChange={setStreamingAssetsPluginEnabled}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="create-plugin">Create Tab</Label>
                        <Switch
                            id="create-plugin"
                            checked={createPluginEnabled}
                            onCheckedChange={setCreatePluginEnabled}
                        />
                    </div>
                </div>
            </CollapsibleCard>
        </div>
    );
};

export default SettingsTab;