interface Config {
  readonly API_URL: string;
  readonly UNSPLASH_ACCESS_KEY: string;
  readonly ADMIN_API_URL: string;
  readonly ADMIN_API_KEY: string;
}

class ConfigValidator {
  private static validateUrl(url: string, name: string): string {
    if (!url) {
      console.warn(`${name} is not configured`);
      return '';
    }

    try {
      const parsedUrl = new URL(url);

      // Security check: warn about non-HTTPS in production
      if (import.meta.env.PROD && parsedUrl.protocol !== 'https:') {
        console.warn(`${name} uses non-HTTPS URL in production: ${url}`);
      }

      return url;
    } catch {
      throw new Error(`Invalid ${name}: ${url}`);
    }
  }

  private static validateApiKey(key: string, name: string): string {
    if (!key) {
      console.warn(`${name} is not configured`);
      return '';
    }

    // Basic length validation
    if (key.length < 16) {
      throw new Error(`${name} is too short (minimum 16 characters)`);
    }

    // Don't log the actual key value for security
    console.debug(`${name} configured (${key.length} characters)`);
    return key;
  }

  static create(): Config {
    try {
      const config = {
        API_URL: this.validateUrl(
          import.meta.env.VITE_API_URL || '',
           'VITE_API_URL'
        ),
        UNSPLASH_ACCESS_KEY: this.validateApiKey(
          import.meta.env.VITE_UNSPLASH_ACCESS_KEY || '',
           'VITE_UNSPLASH_ACCESS_KEY'
        ),
        ADMIN_API_URL: this.validateUrl(
          import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:8000',
           'VITE_ADMIN_API_URL'
        ),
        ADMIN_API_KEY: this.validateApiKey(
          import.meta.env.VITE_ADMIN_API_KEY || '',
           'VITE_ADMIN_API_KEY'
        ),
      };

      return Object.freeze(config);
    } catch (error) {
      console.error('Configuration validation failed:', error);
      throw error;
    }
  }
}

const config = ConfigValidator.create();
export default config;

// Export individual config items for easier testing
export const { API_URL, UNSPLASH_ACCESS_KEY, ADMIN_API_URL, ADMIN_API_KEY } = config;

// AI SDK 5 feature flags for gradual adoption
export const aiSdk5Config = {
  enableDataParts: import.meta.env.VITE_AI_SDK5_DATA_PARTS === 'true' || true, // Default to true for POC
  enableAgenticLoop: import.meta.env.VITE_AI_SDK5_AGENTIC_LOOP === 'true' || false,
  enableSpeechUnification: import.meta.env.VITE_AI_SDK5_SPEECH === 'true' || false,
  enableTypesSafeTools: import.meta.env.VITE_AI_SDK5_TOOLS === 'true' || false,
};
