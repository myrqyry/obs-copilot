// src/services/chuteImageService.ts

export interface ChuteImageParams {
  prompt: string;
  guidance_scale?: number;
  width?: number;
  height?: number;
  num_inference_steps?: number;
  seed?: number | null;
}

export async function generateChuteImage({
  prompt,
  guidance_scale = 7.5,
  width = 1024,
  height = 1024,
  num_inference_steps = 10,
  seed = null,
}: ChuteImageParams): Promise<{ imageUrl?: string; error?: string }> {
  // The client no longer manages API keys. The proxy server will handle it.
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  try {
    // Use local proxy to avoid CORS. The proxy will add the API key.
    const response = await fetch('/api/chutes', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        input_args: {
          prompt,
          guidance_scale,
          width,
          height,
          num_inference_steps,
          seed,
        },
      }),
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
      return { error: 'No image returned from Chute API.' };
    }
  } catch (err: any) {
    return { error: err.message || 'Unknown error calling Chute API.' };
  }
}
