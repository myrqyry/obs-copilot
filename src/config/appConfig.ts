export interface AppConfig {
  obs: {
    defaultPort: number;
    fallbackPorts: number[];
    connectionTimeout: number;
    reconnectAttempts: number;
  };
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
  ui: {
    theme: 'light' | 'dark' | 'system';
    animationDuration: number;
  };
}

const defaultConfig: AppConfig = {
  obs: {
    defaultPort: 4455,
    fallbackPorts: [4455, 4456, 4457],
    connectionTimeout: 5000,
    reconnectAttempts: 3,
  },
  api: {
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    timeout: 10000,
    retries: 3,
  },
  ui: {
    theme: 'system',
    animationDuration: 300,
  }
};

export const appConfig = {
  ...defaultConfig,
  ...(import.meta.env.VITE_CONFIG_OVERRIDE && JSON.parse(import.meta.env.VITE_CONFIG_OVERRIDE))
};