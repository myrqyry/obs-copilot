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

  // Expose higher-level semantic variables so layout components can consume themed values
  // Buttons
  root.style.setProperty('--button-bg', `hsl(${hexToHsl(primaryColor)})`);
  root.style.setProperty('--button-text', `hsl(${hexToHsl(themeMapping['primary-foreground'])})`);
  root.style.setProperty('--button-bg-accent', `hsl(${hexToHsl(accentColor)})`);

  // Navigation / header
  root.style.setProperty('--nav-bg', `hsl(${hexToHsl(themeMapping['card'])})`);
  root.style.setProperty('--nav-foreground', `hsl(${hexToHsl(themeMapping['card-foreground'])})`);

  // Set dynamic accent colors for animations and gradients (theme-aware)
  const userAccent = useSettingsStore.getState().theme.accent;
  const userSecondaryAccent = useSettingsStore.getState().theme.secondaryAccent;
  const currentAccentColor = theme.accentColors?.[userAccent] || accentColor;
  const currentSecondaryAccentColor = theme.accentColors?.[userSecondaryAccent] || primaryColor;
  root.style.setProperty('--dynamic-accent', currentAccentColor);
  root.style.setProperty('--dynamic-secondary-accent', currentSecondaryAccentColor);

  root.style.setProperty('--nav-accent-gradient', `linear-gradient(90deg, ${currentAccentColor}, ${currentSecondaryAccentColor})`);

  // Also expose RGB component variables (without alpha) to support translucent gradients in components.
  // Helper to convert hex to 'r, g, b'
  const hexToRgbComponents = (hex: string): string => {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  };

  try {
    root.style.setProperty('--dynamic-accent-rgb', hexToRgbComponents(currentAccentColor));
    root.style.setProperty('--dynamic-secondary-accent-rgb', hexToRgbComponents(currentSecondaryAccentColor));
  } catch (e) {
    // If parsing fails, set reasonable fallback RGBs (teal/mauve)
    root.style.setProperty('--dynamic-accent-rgb', '148, 226, 213');
    root.style.setProperty('--dynamic-secondary-accent-rgb', '203, 166, 247');
  }

  // Ensure the user-selected accent is the primary semantic color where appropriate.
  // index.css expects --primary and --accent to be HSL components (without the hsl() wrapper)
  // because the stylesheet calls hsl(var(--primary)) etc. Convert the chosen hex to HSL components.
  const userSelectedAccentHex = currentAccentColor;
  try {
  const accentHsl = hexToHsl(userSelectedAccentHex);
    // Set semantic primary/accent variables as HSL component strings so index.css can wrap them with hsl(...)
  root.style.setProperty('--primary', accentHsl);
  root.style.setProperty('--accent', accentHsl);
  root.style.setProperty('--primary-foreground', hexToHsl(themeMapping['primary-foreground']));
  root.style.setProperty('--accent-foreground', hexToHsl(themeMapping['accent-foreground']));

    // Keep dynamic hex values for gradients (these are used directly as colors in gradients)
    root.style.setProperty('--dynamic-accent', currentAccentColor);
    root.style.setProperty('--dynamic-secondary-accent', currentSecondaryAccentColor);
  } catch (e) {
    // If conversion fails for any reason, fall back to existing mappings
    root.style.setProperty('--primary', hexToHsl(themeMapping['primary']));
    root.style.setProperty('--accent', hexToHsl(themeMapping['accent']));
  }

  // Recompute higher-level semantic variables to reference the (possibly overridden) --primary/--accent variables
  // This ensures the user-selected accent actually drives buttons, tabs, shadows and focus ring.
  root.style.setProperty('--button-bg', `hsl(var(--primary))`);
  root.style.setProperty('--button-bg-accent', `hsl(var(--accent))`);
  root.style.setProperty('--button-text', `hsl(var(--primary-foreground))`);

  // Shadow / glow should use the semantic variables so they track user accent
  root.style.setProperty('--shadow-accent', `0 4px 20px hsl(var(--accent) / 0.2)`);
  root.style.setProperty('--shadow-primary', `0 4px 20px hsl(var(--primary) / 0.2)`);
  root.style.setProperty('--primary-glow', `hsl(var(--primary) / 0.3)`);
  root.style.setProperty('--accent-glow', `hsl(var(--accent) / 0.3)`);

  // Tabs and focus ring
  root.style.setProperty('--tab-active-bg', `hsl(var(--primary) / 0.12)`);
  // --tab-active-text is expected to be an HSL "component" string (e.g. "220 14% 10%")
  // index.css calls hsl(var(--tab-active-text)) so we must store the components only here.
  root.style.setProperty('--tab-active-text', hexToHsl(themeMapping['primary-foreground']));
  root.style.setProperty('--focus-ring', `hsl(var(--primary) / 0.6)`);

  // Tabs
  // --tab-active-bg is used directly as a color token (HSL with alpha), keep as-is
  root.style.setProperty('--tab-active-bg', `hsl(${hexToHsl(primaryColor)} / 0.12)`);
  // Store only HSL component strings for text tokens so callers can wrap them with hsl(...)
  root.style.setProperty('--tab-active-text', hexToHsl(themeMapping['primary-foreground']));
  root.style.setProperty('--tab-inactive-bg', `hsl(${hexToHsl(themeMapping['card'])})`);
  root.style.setProperty('--tab-inactive-text', hexToHsl(themeMapping['muted-foreground']));

  // Focus / ring
  root.style.setProperty('--focus-ring', `hsl(${hexToHsl(primaryColor)} / 0.6)`);

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
