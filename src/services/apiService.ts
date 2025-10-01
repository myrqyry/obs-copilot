// src/services/apiService.ts
import { logger } from '../utils/logger';
import { httpClient } from './httpClient';

class ApiService {
  private apiName: string;

  constructor(apiName: string) {
    this.apiName = apiName;
  }

  /**
   * Performs a search by calling our own backend proxy.
   * @param query The search term.
   * @param extraParams Additional query parameters for the specific API.
   * @returns A promise that resolves to the search results.
   */
  async search(query: string, extraParams: Record<string, any> = {}): Promise<any> {
    // All requests now go through our secure, centralized backend.
    const endpoint = `/api/assets/search/${this.apiName}`;

    const params = new URLSearchParams({
      ...extraParams,
      query: query, // FastAPI will see this as 'q' or 'query' based on the request model
    });

    try {
      const response = await httpClient.get(`${endpoint}?${params.toString()}`);
      // The backend now handles finding the data path, so we can just return the data.
      return response.data;
    } catch (error: any) {
      const errorData = error.response?.data?.detail || error.message || 'An unknown error occurred';
      logger.error(`Error fetching data from '${this.apiName}':`, errorData);
      throw new Error(errorData);
    }
  }
}

export const callStreamerBotAction = (action: { type: string; args?: Record<string, unknown> }) => {
  // 💡 This is a placeholder for your actual API call to Streamer.bot
  // The Streamer.bot API would expect a payload with action details.
  // For example:
  // return httpClient.post('/api/streamerbot/action', action);
  
  console.log('API Service: Calling Streamer.bot action:', action);
  return Promise.resolve({ success: true, message: `Action "${action.type}" called.` });
};

export default ApiService;
