// src/components/ui/SettingsTab.tsx
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
    const { obsUrl, obsPassword, geminiApiKey, setObsUrl, setObsPassword, setGeminiApiKey, flipSides, setFlipSides, theme: currentTheme, setTheme, twitchChatPluginEnabled, setTwitchChatPluginEnabled } = useSettingsStore();
    const { theme } = useTheme();

    const [openObsConnection, setOpenObsConnection] = useState(true);
    const [openGeminiAI, setOpenGeminiAI] = useState(true);
    const [openUIPreferences, setOpenUIPreferences] = useState(true);
    const [openPlugins, setOpenPlugins] = useState(true);

    const handlePrimaryColorChange = (color: string) => {
        setTheme({ ...currentTheme, primary: color });
    };

    const handleSecondaryColorChange = (color: string) => {
        setTheme({ ...currentTheme, secondary: color });
    };

    return (
        <div className="space-y-4 p-4">
            <CollapsibleCard title="OBS Connection 📡" isOpen={openObsConnection} onToggle={() => setOpenObsConnection(!openObsConnection)}>
                <div className="space-y-2">
                    <Label htmlFor="obs-url">WebSocket URL</Label>
                    <Input id="obs-url" value={obsUrl} onChange={(e) => setObsUrl(e.target.value)} placeholder="ws://localhost:4455" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="obs-password">Password</Label>
                    <Input id="obs-password" type="password" value={obsPassword ?? ''} onChange={(e) => setObsPassword(e.target.value)} />
                </div>
            </CollapsibleCard>

            <CollapsibleCard title="Gemini AI 🧠" isOpen={openGeminiAI} onToggle={() => setOpenGeminiAI(!openGeminiAI)}>
                 <div className="space-y-2">
                    <Label htmlFor="gemini-api-key">API Key</Label>
                    <Input id="gemini-api-key" type="password" value={geminiApiKey ?? ''} onChange={(e) => setGeminiApiKey(e.target.value)} />
                </div>
            </CollapsibleCard>

            {/* Collapsible Card for UI Preferences */}
            <CollapsibleCard title="UI Preferences 🎨" isOpen={openUIPreferences} onToggle={() => setOpenUIPreferences(!openUIPreferences)}>
                <ThemeChooser />
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
                            colorNameTypeGuard={(name:string): name is CatppuccinAccentColorName => Object.keys(theme.accentColors || {}).includes(name)}
                            onChange={handleSecondaryColorChange}
                        />
                    </>
                )}
                <div className="flex items-center justify-between">
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
