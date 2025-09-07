import React, { useState } from 'react';
import { Button } from '@/components/ui/button.radix';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import useSettingsStore from '../../store/settingsStore';
import { CollapsibleCard } from '@/components/common/CollapsibleCard';
import { ThemeChooser } from '@/components/common/ThemeChooser';
import { ColorChooser } from '@/components/common/ColorChooser';
import { useTheme } from '@/hooks/useTheme';
import { CatppuccinAccentColorName } from '@/types';
import { Switch } from '@/components/ui/switch';

const SettingsTab: React.FC = () => {
    const { flipSides, setFlipSides, theme: currentTheme, setTheme, twitchChatPluginEnabled, setTwitchChatPluginEnabled, setUserChatBubble, setModelChatBubble } = useSettingsStore();
    const { theme } = useTheme();

    const [openUIPreferences, setOpenUIPreferences] = useState(true);
    const [openAccents, setOpenAccents] = useState(true);
    const [openChatBubbles, setOpenChatBubbles] = useState(true);
    const [openPlugins, setOpenPlugins] = useState(true);

    const handlePrimaryColorChange = (color: string) => {
        setTheme({ ...currentTheme, primary: color });
    };

    const handleSecondaryColorChange = (color: string) => {
        setTheme({ ...currentTheme, secondary: color });
    };

    const handleUserChatBubbleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUserChatBubble(e.target.value);
    };

    const handleModelChatBubbleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setModelChatBubble(e.target.value);
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
                            selectedColorName={currentTheme.primary}
                            colorNameTypeGuard={(name: string): name is CatppuccinAccentColorName => Object.keys(theme.accentColors || {}).includes(name)}
                            onChange={handlePrimaryColorChange}
                        />
                        <ColorChooser
                            label="Secondary Accent"
                            colorsHexMap={theme.accentColors}
                            selectedColorName={currentTheme.secondary}
                            colorNameTypeGuard={(name: string): name is CatppuccinAccentColorName => Object.keys(theme.accentColors || {}).includes(name)}
                            onChange={handleSecondaryColorChange}
                        />
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
                    <div className="space-y-2">
                        <Label htmlFor="user-chat-bubble">User Chat Bubble Color</Label>
                        <Input
                            id="user-chat-bubble"
                            type="color"
                            value={currentTheme.userChatBubble}
                            onChange={handleUserChatBubbleChange}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="model-chat-bubble">Model Chat Bubble Color</Label>
                        <Input
                            id="model-chat-bubble"
                            type="color"
                            value={currentTheme.modelChatBubble}
                            onChange={handleModelChatBubbleChange}
                        />
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