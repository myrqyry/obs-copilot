// src/services/chuteImageService.ts
import useApiKeyStore, { ApiService } from '../store/apiKeyStore';

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
    apiKey, // This apiKey param can still be used as a direct override if provided
}: ChuteImageParams): Promise<{ imageUrl?: string; error?: string }> {
    // Priority for API key:
    // 1. Override from Zustand store
    // 2. apiKey parameter passed to this function
    // 3. Default VITE_CHUTES_API_TOKEN from .env (used by proxy if no X-Api-Key is sent)

    const storeOverride = useApiKeyStore.getState().getApiKeyOverride(ApiService.CHUTES);
    const effectiveApiKey = storeOverride || (apiKey?.trim() || undefined);

    // The actual VITE_CHUTES_API_TOKEN from import.meta.env is not directly used here
    // for sending to the proxy, as the proxy itself will use its own environment variable
    // if no X-Api-Key header is received.
    // We only need to send X-Api-Key if we have an *override*.

    const headers: HeadersInit = {
        "Content-Type": "application/json",
    };

    if (effectiveApiKey) {
        headers["X-Api-Key"] = effectiveApiKey;
    } else {
        // If no override is found (neither from store nor from function param),
        // we rely on the proxy to use its default CHUTES_API_TOKEN from its .env.
        // We also check if a default VITE_ key exists just to satisfy the old "token is missing" check,
        // though the proxy's key is what ultimately matters for the Chutes API call.
        const defaultViteKey = import.meta.env.VITE_CHUTES_API_TOKEN || (window as any)?.VITE_CHUTES_API_TOKEN;
        if (!defaultViteKey) {
            // This check is more for the client being aware it might not work if defaults aren't even set for proxy.
             console.warn("Chute API token (VITE_CHUTES_API_TOKEN) is not set in client environment. Proxy's default will be used if available.");
            // We don't return an error here, as the proxy might still have a key.
            // The old logic: return { error: "Chute API token is missing. Please set VITE_CHUTES_API_TOKEN in your environment." };
        }
    }

    try {
        // Use local proxy to avoid CORS
        const response = await fetch("/api/chutes", {
            method: "POST",
            headers: headers,
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
