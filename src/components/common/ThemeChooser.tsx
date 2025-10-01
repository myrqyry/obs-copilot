import React from 'react';
import { useTheme } from '@/hooks/useTheme';
import { themes } from '@/themes';

export const ThemeChooser: React.FC = () => {
  const { themeSettings, setTheme } = useTheme();

  const darkThemes = themes.filter((theme) => theme.type === 'dark');
  const lightThemes = themes.filter((theme) => theme.type === 'light');

  const currentThemeName = themeSettings.base === 'system' ? 'system' : themeSettings.name;

  return (
    <div className="mb-2">
      <label className="block text-sm font-medium mb-1 text-primary">
        Theme
      </label>
      <select
        value={currentThemeName}
        onChange={(e) => setTheme(e.target.value)}
        className="w-full p-2 rounded-md bg-input border border-border"
      >
        <option value="system">System</option>
        <optgroup label="Dark Themes">
          {darkThemes.map((theme) => (
            <option key={theme.name} value={theme.name}>
              {theme.displayName}
            </option>
          ))}
        </optgroup>
        <optgroup label="Light Themes">
          {lightThemes.map((theme) => (
            <option key={theme.name} value={theme.name}>
              {theme.displayName}
            </option>
          ))}
        </optgroup>
      </select>
    </div>
  );
};
