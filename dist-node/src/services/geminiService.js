import axios from 'axios';
export class GeminiService {
    proxyEndpoint;
    constructor() {
        this.proxyEndpoint = '/api/gemini';
    }
    async generateContent(prompt, history) {
        const response = await axios.post(`${this.proxyEndpoint}/generate-content`, {
            prompt,
            history,
        });
        return response.data;
    }
    async generateImage(prompt) {
        const response = await axios.post(`${this.proxyEndpoint}/generate-image`, { prompt });
        return response.data.imageUrl;
    }
}
