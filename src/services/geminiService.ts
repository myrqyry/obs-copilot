import axios from 'axios';

export class GeminiService {
  private proxyEndpoint: string;

  constructor() {
    this.proxyEndpoint = '/api/gemini';
  }

  async generateContent(prompt: string, history?: any[]): Promise<any> {
    const response = await axios.post(`${this.proxyEndpoint}/generate-content`, {
      prompt,
      history,
    });
    return response.data;
  }

  async generateImage(prompt: string): Promise<string> {
    const response = await axios.post(`${this.proxyEndpoint}/generate-image`, { prompt });
    return response.data.imageUrl;
  }
}
