// src/components/ui/SettingsTab.tsx
import React from 'react';
import { Button } from './button.radix';
import { Label } from './label';
import { Input } from './input';
import useSettingsStore from '../../store/settingsStore';
import { CollapsibleCard } from '../common/CollapsibleCard';

const SettingsTab: React.FC = () => {
    const { obsUrl, obsPassword, geminiApiKey, setObsUrl, setObsPassword, setGeminiApiKey, flipSides, setFlipSides } = useSettingsStore();

    return (
        <div className="space-y-4 p-4">
            <CollapsibleCard title="OBS Connection 📡">
                <div className="space-y-2">
                    <Label htmlFor="obs-url">WebSocket URL</Label>
                    <Input id="obs-url" value={obsUrl} onChange={(e) => setObsUrl(e.target.value)} placeholder="ws://localhost:4455" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="obs-password">Password</Label>
                    <Input id="obs-password" type="password" value={obsPassword ?? ''} onChange={(e) => setObsPassword(e.target.value)} />
                </div>
            </CollapsibleCard>

            <CollapsibleCard title="Gemini AI 🧠">
                 <div className="space-y-2">
                    <Label htmlFor="gemini-api-key">API Key</Label>
                    <Input id="gemini-api-key" type="password" value={geminiApiKey ?? ''} onChange={(e) => setGeminiApiKey(e.target.value)} />
                </div>
            </CollapsibleCard>

            {/* Collapsible Card for UI Preferences */}
            <CollapsibleCard title="UI Preferences 🎨">
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
        </div>
    );
};

export default SettingsTab;
