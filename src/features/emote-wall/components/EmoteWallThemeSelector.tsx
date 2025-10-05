import React from 'react';
import { DefaultThemes, EmoteWallTheme } from '../presets/StylePresets';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface EmoteWallThemeSelectorProps {
  currentThemeId: string;
  onThemeChange: (themeId: string) => void;
}

const EmoteWallThemeSelector: React.FC<EmoteWallThemeSelectorProps> = ({
  currentThemeId,
  onThemeChange,
}) => {
  const themes = Object.values(DefaultThemes);

  return (
    <div className="space-y-2">
      <Label htmlFor="theme-selector">Appearance Theme</Label>
      <Select value={currentThemeId} onValueChange={onThemeChange}>
        <SelectTrigger id="theme-selector" className="w-full">
          <SelectValue placeholder="Select a theme..." />
        </SelectTrigger>
        <SelectContent>
          {themes.map((theme: EmoteWallTheme) => (
            <SelectItem key={theme.id} value={theme.id}>
              <div className="flex flex-col">
                <span className="font-bold">{theme.name}</span>
                <span className="text-xs text-muted-foreground">{theme.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default EmoteWallThemeSelector;