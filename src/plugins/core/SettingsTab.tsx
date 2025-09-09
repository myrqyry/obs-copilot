import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import useSettingsStore from '../../store/settingsStore';
import { CollapsibleCard } from '@/components/common/CollapsibleCard';
import { ThemeChooser } from '@/components/common/ThemeChooser';
import { ColorChooser } from '@/components/common/ColorChooser';
import { useTheme } from '@/hooks/useTheme';
import { ChatBubblePreview } from '@/components/common/ChatBubblePreview';
import { CatppuccinAccentColorName } from '@/types';
import { Switch } from '@/components/ui/switch';

const SettingsTab: React.FC = () => {
    const { 
        flipSides, 
        setFlipSides, 
        theme: currentTheme, 
        setAccent,
        setSecondaryAccent,
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
    customChatBackground,
    bubbleFillOpacity,
    chatBubbleBlendMode,
        
    } = useSettingsStore();
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