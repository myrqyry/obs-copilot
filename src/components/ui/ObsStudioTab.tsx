// src/components/ui/ObsStudioTab.tsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { Label } from './label';
import { Input } from './input';
import { useSettingsStore } from '../../store/settingsStore'; // Changed to named import
import { ObsMainControls } from '@/features/connections/ObsMainControls';

const ObsStudioTab: React.FC = () => {
  const { obsUrl, obsPassword, actions } = useSettingsStore();
  const { setObsUrl, setObsPassword } = actions;

  return (
    <div className="space-y-4">
      <Card className="shadow-lg p-6">
        <CardHeader>
          <CardTitle>OBS Studio Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">These settings are used to connect and interact with your OBS Studio instance.</p>
          <div className="space-y-2">
            <Label htmlFor="obs-url">OBS WebSocket URL</Label>
            <Input 
              id="obs-url"
              placeholder="e.g., ws://localhost:4455"
              value={obsUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setObsUrl(e.target.value)} // Added type for 'e'
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="obs-password">OBS WebSocket Password</Label>
            <Input 
              id="obs-password"
              type="password"
              placeholder="Enter your password"
              value={obsPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setObsPassword(e.target.value)} // Added type for 'e'
            />
          </div>
        </CardContent>
      </Card>
      <ObsMainControls />
    </div>
  );
};

export default ObsStudioTab;
