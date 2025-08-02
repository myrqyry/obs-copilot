import axios from 'axios';
import { apiConfigs } from '../config/apis';
import { logger } from '../utils/logger';

type ApiServiceError = {
  message: string;
  status?: number;
};

class ApiService {
  private apiConfig: any;

  constructor(apiName: keyof typeof apiConfigs) {
    this.apiConfig = apiConfigs[apiName];
    if (!this.apiConfig) {
      throw new Error(`API configuration for '${apiName}' not found.`);
    }
  }

  async search(query: string, page: number = 1): Promise<any[]> {
    const {
      baseUrl,
      paramMappings,
      defaultParams,
      requiresKey,
      apiKey,
      responseDataPath,
      authHeader,
    } = this.apiConfig;

    const params = new URLSearchParams({
      ...defaultParams,
      [paramMappings.q || paramMappings.query]: query,
      [paramMappings.page]: page.toString(),
    });

    const headers: Record<string, string> = {};

    if (requiresKey) {
      // In a real app, the key would be fetched from a secure store
      // For now, we'll assume it's in the environment variables as defined in the config
      const key = import.meta.env[apiKey.envVars[1]];
      if (!key) {
        throw new Error(`API key for ${this.apiConfig.label} not found.`);
      }
      if (authHeader) {
        headers[authHeader] = key;
      } else if (apiKey.paramName) {
        params.set(apiKey.paramName, key);
      }
    }

    const url = `${baseUrl}?${params.toString()}`;

    try {
      // All requests are proxied through Netlify functions
      // The actual API call is made from the function, not the client
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
      const response = await axios.get(proxyUrl, { headers });

      let results = response.data;
      if (responseDataPath) {
        const pathParts = responseDataPath.split('.');
        for (const part of pathParts) {
          results = results[part];
        }
      }

      return results || [];

    } catch (error: any) {
      logger.error(`Error fetching data from ${this.apiConfig.label}:`, error);
      const errorData: ApiServiceError = {
        message: error.response?.data?.message || error.message || 'An unknown error occurred',
        status: error.response?.status,
      };
      throw errorData;
    }
  }
}

export default ApiService;
