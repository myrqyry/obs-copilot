import { useEffect } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { getTheme, Theme } from '../types/themes';

export const useTheme = () => {
  const { theme, actions } = useSettingsStore();
  const selectedTheme = getTheme(theme.name);

  useEffect(() => {
    if (selectedTheme) {
      applyTheme(selectedTheme);
    }
  }, [selectedTheme]);

  const setTheme = (themeName: string) => {
    const newTheme = getTheme(themeName);
    if (newTheme) {
      actions.setThemeName(themeName);
      applyTheme(newTheme);
    }
  };

  return { theme: selectedTheme, setTheme };
};

export const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(cssVar(key), value);
  });
};

const cssVar = (name: string) => `--${name.replace('.', '-')}`;
