export interface ChatTheme {
  name: string;
  background: string;
  messageSpacing: number;
  font: {
    family: string;
    size: number;
    weight: string;
  };
  colors: {
    text: string;
    username: string;
    timestamp: string;
    badges: string;
    highlight: string;
  };
  effects: {
    shadows: boolean;
    animations: boolean;
    emoteScale: number;
    borderRadius: number;
  };
  customCSS?: string;
}

export const ChatThemes: Record<string, ChatTheme> = {
  default: {
    name: 'Default',
    background: 'transparent',
    messageSpacing: 4,
    font: {
      family: 'Inter, system-ui, sans-serif',
      size: 14,
      weight: '400'
    },
    colors: {
      text: '#ffffff',
      username: '#9147ff',
      timestamp: '#999999',
      badges: '#ffd700',
      highlight: '#ff6b6b'
    },
    effects: {
      shadows: true,
      animations: true,
      emoteScale: 1.0,
      borderRadius: 8
    }
  },

  minimal: {
    name: 'Minimal',
    background: 'rgba(0, 0, 0, 0.1)',
    messageSpacing: 2,
    font: {
      family: 'JetBrains Mono, monospace',
      size: 12,
      weight: '300'
    },
    colors: {
      text: '#e0e0e0',
      username: '#64b5f6',
      timestamp: '#757575',
      badges: '#90a4ae',
      highlight: '#81c784'
    },
    effects: {
      shadows: false,
      animations: false,
      emoteScale: 0.8,
      borderRadius: 0
    }
  },

  streamer: {
    name: 'Streamer Focus',
    background: 'linear-gradient(135deg, rgba(139, 69, 19, 0.1), rgba(160, 82, 45, 0.1))',
    messageSpacing: 6,
    font: {
      family: 'Roboto, sans-serif',
      size: 16,
      weight: '500'
    },
    colors: {
      text: '#fff5ee',
      username: '#ff7f50',
      timestamp: '#deb887',
      badges: '#ffd700',
      highlight: '#ff4500'
    },
    effects: {
      shadows: true,
      animations: true,
      emoteScale: 1.2,
      borderRadius: 12
    }
  }
};