import React, { useState } from 'react';
import { Button } from '@/components/ui/button.radix';
import { Label } from '@/components/ui/label';
import useSettingsStore from '../../store/settingsStore';
import { CollapsibleCard } from '@/components/common/CollapsibleCard';
import { ThemeChooser } from '@/components/common/ThemeChooser';
import { ColorChooser } from '@/components/common/ColorChooser';
import { useTheme } from '@/hooks/useTheme';
import { CatppuccinAccentColorName } from '@/types';
import { Switch } from '@/components/ui/switch';
import { ChatBubblePreview } from '@/components/common/ChatBubblePreview';

const SettingsTab: React.FC = () => {
    const { 
        flipSides, 
        setFlipSides, 
        theme: currentTheme, 
        setAccent,
        setSecondaryAccent,
        twitchChatPluginEnabled, 
        setTwitchChatPluginEnabled, 
        setUserChatBubble, 
        setModelChatBubble,
        extraDarkMode,
        customChatBackground,
        bubbleFillOpacity,
        chatBubbleBlendMode,
        backgroundOpacity,
        chatBackgroundBlendMode
    } = useSettingsStore();
    const { theme } = useTheme();

    const [openUIPreferences, setOpenUIPreferences] = useState(true);
    const [openAccents, setOpenAccents] = useState(true);
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

    return (
        <div className="space-y-4 p-4">
            {/* Base Theme Section */}
            <CollapsibleCard title="Base Theme 🎨" isOpen={openUIPreferences} onToggle={() => setOpenUIPreferences(!openUIPreferences)}>
                <ThemeChooser />
            </CollapsibleCard>

            {/* Accents Section */}
            <CollapsibleCard title="Accents" isOpen={openAccents} onToggle={() => setOpenAccents(!openAccents)}>
                {theme?.accentColors && (
                    <>
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
                        
                        {/* Accent Colors Preview */}
                        <div className="mt-4 space-y-2">
                            <Label>Accent Colors Preview</Label>
                            <div className="p-4 border rounded-lg bg-background/50">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <div 
                                            className="w-6 h-6 rounded border border-border"
                                            style={{ backgroundColor: theme?.accentColors?.[currentTheme.accent] }}
                                        />
                                        <span className="text-sm text-muted-foreground">Primary: {currentTheme.accent}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div 
                                            className="w-6 h-6 rounded border border-border"
                                            style={{ backgroundColor: theme?.accentColors?.[currentTheme.secondaryAccent] }}
                                        />
                                        <span className="text-sm text-muted-foreground">Secondary: {currentTheme.secondaryAccent}</span>
                                    </div>
                                </div>
                                <div className="mt-3 text-xs text-muted-foreground">
                                    These colors are used for buttons, links, and highlights throughout the interface.
                                </div>
                            </div>
                        </div>
                    </>
                )}
                <div className="flex items-center justify-between mt-4">
                    <Label htmlFor="flip-sides">Swap Sides</Label>
                    <Button
                        id="flip-sides"
                        onClick={() => setFlipSides(!flipSides)}
                        variant="outline"
                    >
                        {flipSides ? 'Left' : 'Right'}
                    </Button>
                </div>
            </CollapsibleCard>

            {/* Chat Bubbles Section */}
            <CollapsibleCard title="Chat Bubbles 💬" isOpen={openChatBubbles} onToggle={() => setOpenChatBubbles(!openChatBubbles)}>
                <div className="space-y-4">
                    {theme?.accentColors && (
                        <>
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
                        </>
                    )}
                    
                    {/* Chat Bubble Preview */}
                    <div className="space-y-2">
                        <Label>Preview</Label>
                        <div className="p-4 border rounded-lg bg-background/50">
                            <ChatBubblePreview
                                userColor={currentTheme.userChatBubble}
                                modelColor={currentTheme.modelChatBubble}
                                flipSides={flipSides}
                                extraDarkMode={extraDarkMode}
                                customBackground={customChatBackground}
                                bubbleFillOpacity={bubbleFillOpacity}
                                chatBubbleBlendMode={chatBubbleBlendMode as React.CSSProperties['mixBlendMode']}
                                backgroundOpacity={backgroundOpacity}
                                chatBackgroundBlendMode={chatBackgroundBlendMode as React.CSSProperties['mixBlendMode']}
                            />
                        </div>
                    </div>
                </div>
            </CollapsibleCard>

            {/* Plugins Section */}
            <CollapsibleCard title="Plugins 🧩" isOpen={openPlugins} onToggle={() => setOpenPlugins(!openPlugins)}>
                <div className="flex items-center justify-between">
                    <Label htmlFor="twitch-chat-plugin">Twitch Chat</Label>
                    <Switch
                        id="twitch-chat-plugin"
                        checked={twitchChatPluginEnabled}
                        onCheckedChange={setTwitchChatPluginEnabled}
                    />
                </div>
            </CollapsibleCard>
        </div>
    );
};

export default SettingsTab;