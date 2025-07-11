import axios from 'axios';
import useApiKeyStore, { ApiService } from '../store/apiKeyStore';

export class GeminiService {
  private proxyEndpoint: string;

  constructor() {
    this.proxyEndpoint = '/api/gemini';
  }

  private getHeaders = () => {
    const headers: Record<string, string> = {};
    const apiKey = useApiKeyStore.getState().getApiKeyOverride(ApiService.GEMINI);
    if (apiKey) {
      headers['X-Api-Key'] = apiKey;
    }
    return headers;
  }

  async generateContent(prompt: string, history?: any[]): Promise<any> {
    const response = await axios.post(
      `${this.proxyEndpoint}/generate-content`,
      {
        prompt,
        history,
      },
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  async generateImage(prompt: string): Promise<string> {
    // Note: The proxy endpoint for generate-image currently returns 501 Not Implemented.
    // This change ensures that if it were implemented, it would also use the override key.
    const response = await axios.post(
      `${this.proxyEndpoint}/generate-image`,
      { prompt },
      { headers: this.getHeaders() }
    );
    return response.data.imageUrl; // This will likely fail until the proxy endpoint is fully implemented.
  }
}
