import { obsClient, ObsClientImpl } from './obsClient';

// Helper function to get current theme colors from CSS custom properties
function getCurrentThemeColors() {
  const root = document.documentElement;
  const style = getComputedStyle(root);
  
  // Helper to convert HSL values to usable colors
  const getHslColor = (property: string, fallback: string) => {
    const hslValue = style.getPropertyValue(property).trim();
    return hslValue ? `hsl(${hslValue})` : fallback;
  };
  
  return {
    primary: getHslColor('--primary', '#a6e3a1'),
    secondary: getHslColor('--secondary', '#94e2d5'), 
    accent: getHslColor('--accent', '#89dceb'),
    background: getHslColor('--background-overlay', 'rgba(30, 30, 46, 0.9)'),
    text: getHslColor('--foreground', '#cdd6f4'),
    border: getHslColor('--border', '#45475a'),
    destructive: getHslColor('--destructive', '#f38ba8'),
    warning: getHslColor('--warning', '#f9e2af'),
    info: getHslColor('--info', '#89b4fa'),
  };
}
export interface TemplateConfig {
  layout: 'overlay' | 'fullscreen' | 'sidebar' | 'corner';
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    text?: string;
    border?: string;
  };
  content?: {
    title?: string;
    subtitle?: string;
    body?: string;
    customHtml?: string;
  };
  animations?: {
    enabled?: boolean;
    speed?: number;
    effects?: {
      glow?: number;
      rainbow?: boolean;
      pulse?: boolean;
    };
  };
  assets?: Array<{
    type: 'image' | 'gif' | 'svg' | 'emoji';
    name: string;
    url?: string;
    content?: string;
  }>;
  autoRefresh?: boolean;
  refreshInterval?: number;
  customCss?: string;
}

export const HtmlTemplateService = {
  getPresetTemplates(): Record<string, any> {
    const themeColors = getCurrentThemeColors();
    
    return {
      'assets-showcase': {
        layout: 'overlay',
        content: {
          title: '🌈 Stream Assets',
          subtitle: 'Amazing graphics and animations',
          body: 'Check out these awesome assets for your stream!',
        },
        animations: {
          enabled: true,
          speed: 0.5,
          effects: {
            glow: 3,
            rainbow: false,
            pulse: true,
          },
        },
        colors: {
          primary: themeColors.accent,
          secondary: themeColors.secondary,
          accent: themeColors.primary,
          background: themeColors.background,
          text: themeColors.text,
          border: themeColors.border,
        },
      'stream-starting': {
        layout: 'overlay',
        content: {
          title: '🔴 STREAM STARTING',
          subtitle: 'Get ready for an amazing stream!',
          body: "We'll be live in just a moment...",
        },
        animations: {
          enabled: true,
          speed: 0.3,
          effects: {
            glow: 2,
            rainbow: true,
            pulse: true,
          },
        },
        colors: {
          primary: '#f38ba8',
          secondary: '#fab387',
          accent: '#a6e3a1',
          background: 'rgba(30, 30, 46, 0.95)',
          text: '#cdd6f4',
          border: '#f38ba8',
        },
        },
        assets: [
          { type: 'image', name: 'Logo', url: '/assets/logo.png' },
          { type: 'gif', name: 'Celebration', url: '/assets/celebration.gif' },
        ],
      },
      'stream-starting': {
        layout: 'overlay',
        content: {
          title: '🔴 STREAM STARTING',
          subtitle: 'Get ready for an amazing stream!',
          body: "We'll be live in just a moment...",
        },
        animations: {
          enabled: true,
          speed: 0.3,
          effects: {
            glow: 2,
            rainbow: true,
            pulse: true,
          },
        },
        colors: {
          primary: themeColors.destructive,
          secondary: themeColors.warning,
          accent: themeColors.accent,
          background: themeColors.background,
          text: themeColors.text,
          border: themeColors.destructive,
        },
      },
      'be-right-back': {
        layout: 'fullscreen',
        content: {
          title: 'Be Right Back!',
          subtitle: '⏰ Taking a quick break',
          body: "Chat amongst yourselves - I'll be back soon!",
        },
        animations: {
          enabled: true,
          speed: 0.5,
          effects: {
            glow: 1,
            rainbow: false,
            pulse: true,
          },
        },
        colors: {
          primary: '#cba6f7',
          secondary: '#f2cdcd',
          accent: '#94e2d5',
          background: 'rgba(17, 17, 27, 0.98)',
          text: '#cdd6f4',
          border: '#45475a',
        },
        assets: [{ type: 'emoji', name: 'Break Emoji', content: '⏰' }],
      },
      'new-follower': {
        layout: 'corner',
        position: 'top-right',
        content: {
          title: '🎉 New Follower!',
          subtitle: 'Welcome to the community',
          body: 'Thank you for following!',
        },
        animations: {
          enabled: true,
          speed: 0.3,
          effects: {
            glow: 3,
            rainbow: true,
            pulse: false,
          },
        },
        autoRefresh: true,
        refreshInterval: 10000,
        colors: {
          primary: '#ffcc00',
          secondary: '#ff9900',
          accent: '#ff6600',
          background: 'rgba(255, 255, 255, 0.9)',
          text: '#333333',
          border: '#ffcc00',
        },
      },
      'chat-display': {
        layout: 'sidebar',
        content: {
          title: '💬 Live Chat',
          subtitle: 'Join the conversation',
          body: '',
        },
        colors: {
          primary: '#89b4fa',
          secondary: '#b4befe',
          accent: '#74c7ec',
          background: 'rgba(30, 30, 46, 0.85)',
          text: '#cdd6f4',
          border: '#585b70',
        },
        animations: {
          enabled: true,
          speed: 0.2,
          effects: {
            glow: 1,
            rainbow: false,
            pulse: true,
          },
        },
      },
    };
  },
  generateTemplateUrl(config: Partial<TemplateConfig>): string {
    const baseUrl = '/public/html-templates/base-template.html';
    const params = encodeURIComponent(JSON.stringify(config));
    return `${baseUrl}?config=${params}`;
  },

  async createBrowserSourceWithTemplate(
    obsClient: ObsClientImpl,
    sourceName: string,
    sceneName: string,
    config: Partial<TemplateConfig>,
    width: number = 800,
    height: number = 600,
  ): Promise<void> {
    const templateUrl = this.generateTemplateUrl(config);
    await obsClient.addBrowserSource(
      sceneName,
      templateUrl,
      sourceName,
      width,
      height,
    );
  },
  async updateBrowserSourceTemplate(
    obsClient: ObsClientImpl,
    sourceName: string,
    config: Partial<TemplateConfig>,
  ): Promise<void> {
    const templateUrl = this.generateTemplateUrl(config);
    await obsClient.call('SetInputSettings', { inputName: sourceName, inputSettings: { url: templateUrl } });
  },
};
