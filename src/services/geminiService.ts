import axios from 'axios';

export class GeminiService {
  private proxyEndpoint: string;

  constructor() {
    this.proxyEndpoint = '/api/gemini';
  }

  private getHeaders = () => {
    // API keys are now handled by the proxy, no need to send from client
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
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
