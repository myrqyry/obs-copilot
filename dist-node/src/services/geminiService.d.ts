export declare class GeminiService {
    private proxyEndpoint;
    constructor();
    generateContent(prompt: string, history?: any[]): Promise<any>;
    generateImage(prompt: string): Promise<string>;
}
