// src/services/chuteImageService.ts

export interface ChuteImageParams {
    prompt: string;
    guidance_scale?: number;
    width?: number;
    height?: number;
    num_inference_steps?: number;
    seed?: number | null;
    apiKey?: string;
}

export async function generateChuteImage({
    prompt,
    guidance_scale = 7.5,
    width = 1024,
    height = 1024,
    num_inference_steps = 10,
    seed = null,
    apiKey,
}: ChuteImageParams): Promise<{ imageUrl?: string; error?: string }> {
    const apiToken =
        (apiKey && apiKey.trim().length > 0)
            ? apiKey.trim()
            : (import.meta.env.VITE_CHUTES_API_TOKEN || (window as any)?.VITE_CHUTES_API_TOKEN);
    if (!apiToken) {
        return { error: "Chute API token is missing. Please set VITE_CHUTES_API_TOKEN in your environment." };
    }

    try {
        // Use local proxy to avoid CORS
        const response = await fetch("/api/chutes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                input_args: {
                    prompt,
                    guidance_scale,
                    width,
                    height,
                    num_inference_steps,
                    seed
                }
            })
        });

        if (!response.ok) {
            return { error: `Chute API error: ${response.status} ${response.statusText}` };
        }

        const data = await response.json();
        if (data.image_url) {
            return { imageUrl: data.image_url };
        } else if (data.images && Array.isArray(data.images) && data.images.length > 0) {
            return { imageUrl: data.images[0] };
        } else {
            return { error: "No image returned from Chute API." };
        }
    } catch (err: any) {
        return { error: err.message || "Unknown error calling Chute API." };
    }
}
