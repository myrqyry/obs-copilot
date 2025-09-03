import React from 'react';
import { useTheme } from '@/hooks/useTheme';
import { darkThemes, lightThemes } from '@/types/themes';

export const ThemeChooser: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="mb-2">
      <label className="block text-sm font-medium mb-1 text-primary">
        Theme
      </label>
      <select
        value={theme?.name}
        onChange={(e) => {
          const selectedOption = e.target.selectedOptions[0];
          const themeType = selectedOption.dataset.type as 'light' | 'dark' | 'system';
          setTheme(themeType);
        }}
        className="w-full p-2 rounded-md bg-input border border-border"
      >
        <optgroup label="Dark Themes">
          {darkThemes.map((theme) => (
            <option key={theme.name} value={theme.name} data-type={theme.type}>
              {theme.displayName}
            </option>
          ))}
        </optgroup>
        <optgroup label="Light Themes">
          {lightThemes.map((theme) => (
            <option key={theme.name} value={theme.name} data-type={theme.type}>
              {theme.displayName}
            </option>
          ))}
        </optgroup>
      </select>
    </div>
  );
};
