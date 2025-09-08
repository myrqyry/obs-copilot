import { useEffect } from 'react';
import useSettingsStore from '@/store/settingsStore';
import { Theme, CatppuccinAccentColorName } from '@/types/themes';
import { themes } from '@/themes';

const getTheme = (name: string): Theme | undefined => {
  return themes.find((theme) => theme.name === name);
};

export const useTheme = () => {
  // Use individual selectors to prevent re-renders
  const themeSettings = useSettingsStore((state) => state.theme);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const setThemeBase = useSettingsStore((state) => state.setThemeBase);
  const setAccent = useSettingsStore((state) => state.setAccent);
  const setSecondaryAccent = useSettingsStore((state) => state.setSecondaryAccent);
  const setUserChatBubble = useSettingsStore((state) => state.setUserChatBubble);
  const setModelChatBubble = useSettingsStore((state) => state.setModelChatBubble);
  
  // Get the actual theme object based on stored theme name
  const currentTheme = getTheme(themeSettings.name);
  
  useEffect(() => {
    if (currentTheme) {
      applyTheme(currentTheme);
      
      // Fallback: if current accent colors don't exist in the new theme, reset to first available
      if (currentTheme.accentColors) {
        const availableColors = Object.keys(currentTheme.accentColors);
        
        if (!availableColors.includes(themeSettings.accent)) {
          setAccent(availableColors[0] as CatppuccinAccentColorName);
        }
        
        if (!availableColors.includes(themeSettings.secondaryAccent)) {
          setSecondaryAccent((availableColors[1] || availableColors[0]) as CatppuccinAccentColorName);
        }
        
        if (!availableColors.includes(themeSettings.userChatBubble)) {
          setUserChatBubble(availableColors[0]);
        }
        
        if (!availableColors.includes(themeSettings.modelChatBubble)) {
          setModelChatBubble(availableColors[1] || availableColors[0]);
        }
      }
    }
  }, [themeSettings.name, themeSettings.accent, themeSettings.secondaryAccent]); // React to theme changes

  const handleSetTheme = (themeName: string) => {
    if (themeName === 'system') {
      setThemeBase('system');
      // Keep current theme name but set base to system
    } else {
      const selectedTheme = getTheme(themeName);
      if (selectedTheme) {
        setTheme(themeName);
        setThemeBase(selectedTheme.type); // Set light or dark
        applyTheme(selectedTheme);
      }
    }
  };

  return { theme: currentTheme, themeSettings, setTheme: handleSetTheme };
};

export const applyTheme = (theme: Theme) => {
  const root = document.documentElement;

  // Helper function to convert hex to HSL
  const hexToHsl = (hex: string): string => {
    // Remove # if present
    const cleanHex = hex.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    // Convert to percentages and degrees
    const hDeg = Math.round(h * 360);
    const sPercent = Math.round(s * 100);
    const lPercent = Math.round(l * 100);

    return `${hDeg} ${sPercent}% ${lPercent}%`;
  };

  // Helper function to safely get color value
  const getColorValue = (colorKey: string, fallback: string): string => {
    const value = theme.colors[colorKey];
    return typeof value === 'string' ? value : fallback;
  };

  // Map theme colors to semantic CSS variables with theme-specific mappings
  const getThemeSpecificColor = (keys: string[], fallback: string): string => {
    for (const key of keys) {
      const value = theme.colors[key];
      if (typeof value === 'string') return value;
    }
    return fallback;
  };

  const themeMapping: Record<string, string> = {
    // Core semantic colors with theme-specific mappings
    'background': getThemeSpecificColor(['base', 'bg', 'base03', 'background'], '#1e1e2e'),
    'foreground': getThemeSpecificColor(['text', 'fg', 'base0', 'foreground'], '#cdd6f4'),
    'card': getThemeSpecificColor(['surface0', 'surface', 'base02', 'surface'], 
            theme.name.includes('gruvbox') ? (theme.type === 'dark' ? '#3c3836' : '#f2e5bc') :
            theme.name.includes('solarized') ? (theme.type === 'dark' ? '#073642' : '#eee8d5') :
            '#313244'),
    'card-foreground': getThemeSpecificColor(['text', 'fg', 'base0', 'foreground'], '#cdd6f4'),
    'popover': getThemeSpecificColor(['surface1', 'surface', 'base02', 'surface'], 
               theme.name.includes('gruvbox') ? (theme.type === 'dark' ? '#504945' : '#ebdbb2') :
               theme.name.includes('solarized') ? (theme.type === 'dark' ? '#073642' : '#eee8d5') :
               '#45475a'),
    'popover-foreground': getThemeSpecificColor(['text', 'fg', 'base0', 'foreground'], '#cdd6f4'),
    'primary': getThemeSpecificColor(['mauve', 'love', 'purple', 'blue', 'primary'], '#cba6f7'),
    'primary-foreground': getThemeSpecificColor(['base', 'bg', 'base03', 'background'], '#1e1e2e'),
    'secondary': getThemeSpecificColor(['surface0', 'surface', 'base02', 'secondary'], 
                theme.name.includes('gruvbox') ? (theme.type === 'dark' ? '#3c3836' : '#f2e5bc') :
                theme.name.includes('solarized') ? (theme.type === 'dark' ? '#073642' : '#eee8d5') :
                '#313244'),
    'secondary-foreground': getThemeSpecificColor(['subtext0', 'subtle', 'base01', 'subtle'], '#a6adc8'),
    'muted': getThemeSpecificColor(['overlay0', 'muted', 'gray', 'base01'], '#6c7086'),
    'muted-foreground': getThemeSpecificColor(['subtext1', 'subtle', 'base00', 'subtle'], '#bac2de'),
    'accent': getThemeSpecificColor(['teal', 'foam', 'cyan', 'aqua', 'accent'], '#94e2d5'),
    'accent-foreground': getThemeSpecificColor(['base', 'bg', 'base03', 'background'], '#1e1e2e'),
    'destructive': getThemeSpecificColor(['red'], '#f38ba8'),
    'destructive-foreground': getThemeSpecificColor(['base', 'bg', 'base03', 'background'], '#1e1e2e'),
    'info': getThemeSpecificColor(['blue'], '#89b4fa'),
    'info-foreground': getThemeSpecificColor(['base', 'bg', 'base03', 'background'], '#1e1e2e'),
    'warning': getThemeSpecificColor(['yellow', 'orange'], '#f9e2af'),
    'warning-foreground': getThemeSpecificColor(['base', 'bg', 'base03', 'background'], '#1e1e2e'),
    'border': getThemeSpecificColor(['surface2', 'overlay', 'gray', 'base01'], 
             theme.name.includes('gruvbox') ? (theme.type === 'dark' ? '#504945' : '#d5c4a1') :
             theme.name.includes('solarized') ? (theme.type === 'dark' ? '#586e75' : '#93a1a1') :
             '#585b70'),
    'input': getThemeSpecificColor(['surface0', 'surface', 'base02', 'input'], 
            theme.name.includes('gruvbox') ? (theme.type === 'dark' ? '#3c3836' : '#f2e5bc') :
            theme.name.includes('solarized') ? (theme.type === 'dark' ? '#073642' : '#eee8d5') :
            '#313244'),
    'ring': getThemeSpecificColor(['mauve', 'love', 'purple', 'blue', 'primary'], '#cba6f7'),
  };

  // Apply semantic color mappings
  Object.entries(themeMapping).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, hexToHsl(value));
  });

  // Set additional overlay and effect variables
  const backgroundColor = themeMapping['background'];
  const accentColor = themeMapping['accent'];
  const primaryColor = themeMapping['primary'];
  const destructiveColor = themeMapping['destructive'];
  const warningColor = themeMapping['warning'];
  
  // Convert background to overlay with transparency
  const bgHsl = hexToHsl(backgroundColor);
  const [h, s, l] = bgHsl.split(' ');
  root.style.setProperty('--background-overlay', `${h} ${s} ${l} / 0.8`);
  
  // Set glow effects
  root.style.setProperty('--accent-glow', `hsl(${hexToHsl(accentColor)} / 0.3)`);
  root.style.setProperty('--primary-glow', `hsl(${hexToHsl(primaryColor)} / 0.3)`);
  root.style.setProperty('--destructive-glow', `hsl(${hexToHsl(destructiveColor)} / 0.3)`);
  root.style.setProperty('--warning-glow', `hsl(${hexToHsl(warningColor)} / 0.3)`);
  
  // Set subtle variations
  root.style.setProperty('--accent-subtle', `hsl(${hexToHsl(accentColor)} / 0.1)`);
  root.style.setProperty('--primary-subtle', `hsl(${hexToHsl(primaryColor)} / 0.1)`);
  root.style.setProperty('--destructive-subtle', `hsl(${hexToHsl(destructiveColor)} / 0.1)`);
  
  // Set shadow variables
  root.style.setProperty('--shadow-lg', `hsl(${hexToHsl(themeMapping['foreground'])} / 0.4)`);
  root.style.setProperty('--shadow-accent', `0 4px 20px hsl(${hexToHsl(accentColor)} / 0.2)`);
  root.style.setProperty('--shadow-primary', `0 4px 20px hsl(${hexToHsl(primaryColor)} / 0.2)`);

  // Set dynamic accent colors for animations and gradients (theme-aware)
  const userAccent = useSettingsStore.getState().theme.accent;
  const userSecondaryAccent = useSettingsStore.getState().theme.secondaryAccent;
  
  const currentAccentColor = theme.accentColors?.[userAccent] || accentColor;
  const currentSecondaryAccentColor = theme.accentColors?.[userSecondaryAccent] || primaryColor;
  
  root.style.setProperty('--dynamic-accent', currentAccentColor);
  root.style.setProperty('--dynamic-secondary-accent', currentSecondaryAccentColor);

  // Apply accent colors as CSS variables if present
  if (theme.accentColors) {
    Object.entries(theme.accentColors).forEach(([key, value]) => {
      root.style.setProperty(`--accent-${key}`, value);
    });
  }

  // Toggle Tailwind dark mode class based on theme metadata or heuristic
  const isDark = theme.type === 'dark';

  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};
