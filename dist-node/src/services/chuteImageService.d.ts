export interface ChuteImageParams {
    prompt: string;
    guidance_scale?: number;
    width?: number;
    height?: number;
    num_inference_steps?: number;
    seed?: number | null;
    apiKey?: string;
}
export declare function generateChuteImage({ prompt, guidance_scale, width, height, num_inference_steps, seed, apiKey, }: ChuteImageParams): Promise<{
    imageUrl?: string;
    error?: string;
}>;
