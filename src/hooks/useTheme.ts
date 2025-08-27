import { useEffect } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { getTheme, Theme } from '@/types/themes';

export const useTheme = () => {
  // Use individual selectors to prevent re-renders
  const themeName = useSettingsStore((state) => state.theme.name);
  const setThemeName = useSettingsStore((state) => state.actions.setThemeName);
  
  const selectedTheme = getTheme(themeName);

  useEffect(() => {
    if (selectedTheme) {
      applyTheme(selectedTheme);
    }
  }, [selectedTheme]);

  const setTheme = (themeName: string) => {
    const newTheme = getTheme(themeName);
    if (newTheme) {
      setThemeName(themeName);
      applyTheme(newTheme);
    }
  };

  return { theme: selectedTheme, setTheme };
};

export const applyTheme = (theme: Theme) => {
  const root = document.documentElement;

  // Apply CSS variable tokens
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(cssVar(key), value);
  });

  // Toggle Tailwind dark mode class based on theme metadata or heuristic
  const isDark = theme.type === 'dark';

  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

const cssVar = (name: string) => `--${name.replace('.', '-')}`;
