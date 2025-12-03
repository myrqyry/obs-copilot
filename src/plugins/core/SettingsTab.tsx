import React, { useState, useCallback, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/Button';
import useConfigStore from '../../store/configStore';
import useUiStore from '@/store/uiStore';
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
import type { ChatBackgroundType, PatternName } from '@/types/chatBackground';
import { useShallow } from 'zustand/react/shallow';
import { ConnectionSettings } from '@/components/settings/ConnectionSettings';

const SettingsTab: React.FC = () => {
    // ✅ FIX 1: Split selections into smaller, focused hooks

    // Theme-related state only
    const themeState = useConfigStore(
        useShallow((state) => ({
            theme: state.theme,
            setAccent: state.setAccent,
            setSecondaryAccent: state.setSecondaryAccent,
            extraDarkMode: state.extraDarkMode,
            setExtraDarkMode: state.setExtraDarkMode,
        }))
    );

    // Chat bubble state only
    const chatBubbleState = useConfigStore(
        useShallow((state) => ({
            setUserChatBubble: state.setUserChatBubble,
            setModelChatBubble: state.setModelChatBubble,
            bubbleFillOpacity: state.bubbleFillOpacity,
            chatBubbleBlendMode: state.chatBubbleBlendMode,
        }))
    );

    // Chat background state only
    const chatBackgroundState = useConfigStore(
        useShallow((state) => ({
            customChatBackground: state.customChatBackground,
            setCustomChatBackground: state.setCustomChatBackground,
            chatBackgroundType: state.chatBackgroundType,
            setChatBackgroundType: state.setChatBackgroundType,
            chatPattern: state.chatPattern,
            setChatPattern: state.setChatPattern,
        }))
    );

    // Plugin toggles - these change frequently, so isolate them
    const pluginState = useConfigStore(
        useShallow((state) => ({
            twitchChatPluginEnabled: state.twitchChatPluginEnabled,
            setTwitchChatPluginEnabled: state.setTwitchChatPluginEnabled,
            automationPluginEnabled: state.automationPluginEnabled,
            setAutomationPluginEnabled: state.setAutomationPluginEnabled,
            streamingAssetsPluginEnabled: state.streamingAssetsPluginEnabled,
            setStreamingAssetsPluginEnabled: state.setStreamingAssetsPluginEnabled,
            createPluginEnabled: state.createPluginEnabled,
            setCreatePluginEnabled: state.setCreatePluginEnabled,
            connectionsPluginEnabled: state.connectionsPluginEnabled,
            setConnectionsPluginEnabled: state.setConnectionsPluginEnabled,
            obsStudioPluginEnabled: state.obsStudioPluginEnabled,
            setObsStudioPluginEnabled: state.setObsStudioPluginEnabled,
            geminiPluginEnabled: state.geminiPluginEnabled,
            setGeminiPluginEnabled: state.setGeminiPluginEnabled,
            settingsPluginEnabled: state.settingsPluginEnabled,
            setSettingsPluginEnabled: state.setSettingsPluginEnabled,
            advancedPluginEnabled: state.advancedPluginEnabled,
            setAdvancedPluginEnabled: state.setAdvancedPluginEnabled,
            emoteWallPluginEnabled: state.emoteWallPluginEnabled,
            setEmoteWallPluginEnabled: state.setEmoteWallPluginEnabled,
        }))
    );

    // API keys - rarely change
    const GEMINI_API_KEY = useConfigStore(state => state.GEMINI_API_KEY);
    const setApiKey = useConfigStore(state => state.setApiKey);

    const { regenerateChatOverlay } = useOverlaysStore();

    // UI-specific state
    const flipSides = useUiStore(state => state.flipSides);
    const setFlipSides = useUiStore(state => state.setFlipSides);
    const { theme } = useTheme();

    const [openUIPreferences, setOpenUIPreferences] = useState(true);
    const [openConnectionSettings, setOpenConnectionSettings] = useState(true);
    const [openChatBubbles, setOpenChatBubbles] = useState(true);
    const [openPlugins, setOpenPlugins] = useState(true);

    // Type guard for available accent colors in current theme
    // Memoize with JSON.stringify of keys to ensure stability even if theme object reference changes
    const themeAccentKeys = useMemo(() => Object.keys(theme?.accentColors || {}).sort().join(','), [theme?.accentColors]);
    
    const isValidAccentColor = useCallback((name: string): name is CatppuccinAccentColorName => {
        return themeAccentKeys.includes(name);
    }, [themeAccentKeys]);

    const handlePrimaryColorChange = useCallback((color: string) => {
        themeState.setAccent(color as CatppuccinAccentColorName);
    }, [themeState.setAccent]);

    const handleSecondaryColorChange = useCallback((color: string) => {
        themeState.setSecondaryAccent(color as CatppuccinAccentColorName);
    }, [themeState.setSecondaryAccent]);

    const handleUserChatBubbleChange = useCallback((color: string) => {
        chatBubbleState.setUserChatBubble(color);
    }, [chatBubbleState.setUserChatBubble]);

    const handleModelChatBubbleChange = useCallback((color: string) => {
        chatBubbleState.setModelChatBubble(color);
    }, [chatBubbleState.setModelChatBubble]);

    const handleRegenerateOverlay = useCallback(async () => {
        try {
            await regenerateChatOverlay();
        } catch (error) {
            console.error('Failed to regenerate chat overlay:', error);
        }
    }, [regenerateChatOverlay]);

    return (
        <div className="space-y-4 p-4">
            {/* Combined Theme & Colors Section */}
            <CollapsibleCard title="Theme & Colors 🎨" isOpen={openUIPreferences} onToggle={() => setOpenUIPreferences(!openUIPreferences)}>
                <div className="space-y-3">
                    <div className="mb-2">
                        <ThemeChooser />
                    </div>
                    {theme?.accentColors && (
                        <div>
                            <div className="flex gap-4 items-start">
                                <div className="flex-1 space-y-3">
                                    <ColorChooser
                                        label="Primary Accent"
                                        colorsHexMap={theme.accentColors}
                                        selectedColorName={themeState.theme.accent}
                                        colorNameTypeGuard={isValidAccentColor}
                                        onChange={handlePrimaryColorChange}
                                    />
                                    <ColorChooser
                                        label="Secondary Accent"
                                        colorsHexMap={theme.accentColors}
                                        selectedColorName={themeState.theme.secondaryAccent}
                                        colorNameTypeGuard={isValidAccentColor}
                                        onChange={handleSecondaryColorChange}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </CollapsibleCard>

            {/* API Keys Section */}
            <CollapsibleCard title="API Keys 🔑" isOpen={true} onToggle={() => {}}>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="gemini-api-key">Gemini API Key (for Lyria RealTime)</Label>
                        <Input
                            id="gemini-api-key"
                            type="password"
                            placeholder="Enter your Gemini API Key"
                            value={GEMINI_API_KEY}
                            onChange={(e) => setApiKey('GEMINI_API_KEY', e.target.value)}
                            className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                            Required for real-time music generation features. Get one at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google AI Studio</a>.
                        </p>
                    </div>
                </div>
            </CollapsibleCard>

            {/* Connection Settings Section */}
            <CollapsibleCard title="Connection Settings 🔌" isOpen={openConnectionSettings} onToggle={() => setOpenConnectionSettings(!openConnectionSettings)}>
                <ConnectionSettings />
            </CollapsibleCard>

            {/* Chat Bubbles Section */}
            <CollapsibleCard title="Chat Bubbles 💬" isOpen={openChatBubbles} onToggle={() => setOpenChatBubbles(!openChatBubbles)}>
                <div className="space-y-4">
                    {theme?.accentColors && (
                        <div className="flex gap-6 items-stretch">
                            <div className="flex-1 space-y-4">
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
                                                checked={themeState.extraDarkMode}
                                                onCheckedChange={(val: boolean) => themeState.setExtraDarkMode(!!val)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <ColorChooser
                                    label="User Chat Bubble Color"
                                    colorsHexMap={theme.accentColors}
                                    selectedColorName={themeState.theme.userChatBubble}
                                    colorNameTypeGuard={isValidAccentColor}
                                    onChange={handleUserChatBubbleChange}
                                />
                                <ColorChooser
                                    label="Model Chat Bubble Color"
                                    colorsHexMap={theme.accentColors}
                                    selectedColorName={themeState.theme.modelChatBubble}
                                    colorNameTypeGuard={isValidAccentColor}
                                    onChange={handleModelChatBubbleChange}
                                />

                                {/* Chat Background */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Chat Background Type</Label>
                                    <RadioGroup
                                        value={chatBackgroundState.chatBackgroundType}
                                        onValueChange={(value: ChatBackgroundType) => chatBackgroundState.setChatBackgroundType(value)}
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="image" id="bg-image" />
                                            <Label htmlFor="bg-image">Image</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="css" id="bg-css" />
                                            <Label htmlFor="bg-css">CSS Pattern</Label>
                                        </div>
                                    </RadioGroup>

                                    {chatBackgroundState.chatBackgroundType === 'image' && (
                                        <>
                                            <Label className="text-sm font-medium">Chat Background Image</Label>
                                            <div className="space-y-2">
                                                <Input
                                                    type="url"
                                                    placeholder="Enter image URL (e.g., https://example.com/bg.jpg)"
                                                    value={chatBackgroundState.customChatBackground || ''}
                                                    onChange={(e) => chatBackgroundState.setCustomChatBackground(e.target.value)}
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
                                                                    chatBackgroundState.setCustomChatBackground(ev.target?.result as string);
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
                                                        onClick={() => chatBackgroundState.setCustomChatBackground('')}
                                                    >
                                                        Clear
                                                    </Button>
                                                </div>
                                                {chatBackgroundState.customChatBackground && (
                                                    <div className="text-xs text-muted-foreground">
                                                        {chatBackgroundState.customChatBackground.startsWith('data:') ? 'Local file loaded' : 'URL set'}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}

                                    {chatBackgroundState.chatBackgroundType === 'css' && chatBackgroundState.chatPattern && (
                                        <div className="space-y-3">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium">Pattern</Label>
                                                <Select
                                                    value={chatBackgroundState.chatPattern.name}
                                                    onValueChange={(value: PatternName) =>
                                                        chatBackgroundState.setChatPattern({ ...chatBackgroundState.chatPattern, name: value })
                                                    }
                                                >
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
                                                        value={chatBackgroundState.chatPattern.backColor}
                                                        onChange={(e) =>
                                                            chatBackgroundState.setChatPattern({
                                                                ...chatBackgroundState.chatPattern,
                                                                backColor: e.target.value
                                                            })
                                                        }
                                                        className="w-full h-10"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs">Front Color</Label>
                                                    <Input
                                                        type="color"
                                                        value={chatBackgroundState.chatPattern.frontColor}
                                                        onChange={(e) =>
                                                            chatBackgroundState.setChatPattern({
                                                                ...chatBackgroundState.chatPattern,
                                                                frontColor: e.target.value
                                                            })
                                                        }
                                                        className="w-full h-10"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <Label className="text-sm font-medium">Opacity</Label>
                                                <Slider
                                                    value={[chatBackgroundState.chatPattern.opacity]}
                                                    onChange={(value) =>
                                                        chatBackgroundState.setChatPattern({
                                                            ...chatBackgroundState.chatPattern,
                                                            opacity: Array.isArray(value) ? (value[0] ?? 0) : value
                                                        })
                                                    }
                                                    min={0}
                                                    max={1}
                                                    step={0.01}
                                                />
                                                <div className="text-xs text-muted-foreground">
                                                    {chatBackgroundState.chatPattern.opacity}
                                                </div>
                                            </div>
                                            <div>
                                                <Label className="text-sm font-medium">Spacing</Label>
                                                <Input
                                                    type="text"
                                                    placeholder="100px"
                                                    value={chatBackgroundState.chatPattern.spacing}
                                                    onChange={(e) =>
                                                        chatBackgroundState.setChatPattern({
                                                            ...chatBackgroundState.chatPattern,
                                                            spacing: e.target.value
                                                        })
                                                    }
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

                            {/* Right column preview */}
                            <div className="flex-shrink-0 w-80 md:w-96 flex flex-col">
                                <ChatBubblePreview
                                    userColor={themeState.theme.userChatBubble}
                                    modelColor={themeState.theme.modelChatBubble}
                                    flipSides={flipSides}
                                    extraDarkMode={themeState.extraDarkMode}
                                    customBackground={chatBackgroundState.customChatBackground || ''}
                                    bubbleFillOpacity={chatBubbleState.bubbleFillOpacity}
                                    secondaryAccent={themeState.theme.secondaryAccent}
                                    chatBubbleBlendMode={chatBubbleState.chatBubbleBlendMode as React.CSSProperties['mixBlendMode']}
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
                            checked={pluginState.twitchChatPluginEnabled}
                            onCheckedChange={pluginState.setTwitchChatPluginEnabled}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="automation-plugin">Automation</Label>
                        <Switch
                            id="automation-plugin"
                            checked={pluginState.automationPluginEnabled}
                            onCheckedChange={pluginState.setAutomationPluginEnabled}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="streaming-assets-plugin">Streaming Assets</Label>
                        <Switch
                            id="streaming-assets-plugin"
                            checked={pluginState.streamingAssetsPluginEnabled}
                            onCheckedChange={pluginState.setStreamingAssetsPluginEnabled}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="create-plugin">Create Tab</Label>
                        <Switch
                            id="create-plugin"
                            checked={pluginState.createPluginEnabled}
                            onCheckedChange={pluginState.setCreatePluginEnabled}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="connections-plugin">Connections</Label>
                        <Switch
                            id="connections-plugin"
                            checked={pluginState.connectionsPluginEnabled}
                            onCheckedChange={pluginState.setConnectionsPluginEnabled}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="obs-studio-plugin">OBS Studio</Label>
                        <Switch
                            id="obs-studio-plugin"
                            checked={pluginState.obsStudioPluginEnabled}
                            onCheckedChange={pluginState.setObsStudioPluginEnabled}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="gemini-plugin">Gemini</Label>
                        <Switch
                            id="gemini-plugin"
                            checked={pluginState.geminiPluginEnabled}
                            onCheckedChange={pluginState.setGeminiPluginEnabled}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="settings-plugin">Settings</Label>
                        <Switch
                            id="settings-plugin"
                            checked={pluginState.settingsPluginEnabled}
                            onCheckedChange={pluginState.setSettingsPluginEnabled}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="advanced-plugin">Advanced</Label>
                        <Switch
                            id="advanced-plugin"
                            checked={pluginState.advancedPluginEnabled}
                            onCheckedChange={pluginState.setAdvancedPluginEnabled}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="emote-wall-plugin">Emote Wall</Label>
                        <Switch
                            id="emote-wall-plugin"
                            checked={pluginState.emoteWallPluginEnabled}
                            onCheckedChange={pluginState.setEmoteWallPluginEnabled}
                        />
                    </div>
                </div>
            </CollapsibleCard>
        </div>
    );
};

export default SettingsTab;
