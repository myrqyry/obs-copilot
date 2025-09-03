type Pipeline = Awaited<ReturnType<typeof import('@xenova/transformers')['pipeline']>>;
/**
 * Embeddings adapter supporting:
 *  - LOCAL: @xenova/transformers (all-MiniLM-L6-v2) via embeddings.js-style API
 *  - GEMINI: text-embedding-004 via Google Generative Language API
 *
 * Provider is controlled by EMBEDDINGS_PROVIDER env var: 'LOCAL' (default) | 'GEMINI'
 * For GEMINI, set GOOGLE_API_KEY or GEMINI_API_KEY.
 */
export type EmbeddingsProvider = 'LOCAL' | 'GEMINI';

type TransformersJs = {
  pipeline: (task: string, model: string) => Promise<Pipeline>;
};

interface GeminiEmbeddingResponse {
  responses: {
    embedding?: {
      values: number[];
    };
  }[];
}

export interface Embedder {
  embed(texts: string[]): Promise<Float32Array[]>;
  dim(): Promise<number>;
}

function isServerEnv(): boolean {
  return typeof window === 'undefined';
}

export function getProvider(): EmbeddingsProvider {
  const envVal = (import.meta as { env: Record<string, string> }).env?.VITE_EMBEDDINGS_PROVIDER;
  const serverVal = isServerEnv() ? (typeof process !== 'undefined' ? process.env.EMBEDDINGS_PROVIDER : undefined) : undefined;
  const p = envVal ?? serverVal;
  if (p && typeof p === 'string' && p.toUpperCase() === 'GEMINI') return 'GEMINI';
  return 'LOCAL';
}

export async function createEmbedder(provider: EmbeddingsProvider = getProvider()): Promise<Embedder> {
  if (provider === 'GEMINI') {
    return new GeminiEmbedder();
  }
  return new LocalXenovaEmbedder();
}

/**
 * Local embeddings implementation using @xenova/transformers.
 * Loads a small, fast sentence embedding model and returns mean pooled, normalized vectors.
 */
class LocalXenovaEmbedder implements Embedder {
  private _pipelinePromise: Promise<Pipeline> | null = null;
  private _dim: number | null = null;

  private async getPipeline() {
    if (!this._pipelinePromise) {
      const { pipeline } = (await import('@xenova/transformers')) as TransformersJs;
      this._pipelinePromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    return this._pipelinePromise;
  }

  async embed(texts: string[]): Promise<Float32Array[]> {
    const pipe = await this.getPipeline();
    const outputs: Float32Array[] = [];
    for (const t of texts) {
      const out = await pipe(t, { pooling: 'mean', normalize: true });
      const vec = Float32Array.from(out.data);
      if (!this._dim) this._dim = vec.length;
      outputs.push(vec);
    }
    return outputs;
  }

  async dim(): Promise<number> {
    if (this._dim) return this._dim;
    // prime with a dummy call to determine dim lazily
    const v = await this.embed(['dim-probe']);
    this._dim = v[0].length;
    return this._dim!;
  }
}

/**
 * Gemini embeddings implementation using text-embedding-004.
 */
class GeminiEmbedder implements Embedder {
  private _dim: number | null = null;

  private getApiKey(): string {
    const keyFromEnv =
      (import.meta as { env: Record<string, string> }).env?.VITE_GOOGLE_API_KEY;
    const serverKey = (typeof process !== 'undefined' ? process.env.GOOGLE_API_KEY : undefined) ?? (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined);
    const k = keyFromEnv ?? serverKey;
    if (!k) {
      throw new Error('Gemini embedder requires GOOGLE_API_KEY or GEMINI_API_KEY.');
    }
    return k;
  }

  async embed(texts: string[]): Promise<Float32Array[]> {
    const apiKey = this.getApiKey();
    const url =
      'https://generativelanguage.googleapis.com/v1/models/text-embedding-004:embedContent?key=' +
      encodeURIComponent(apiKey);
    const outputs: Float32Array[] = [];
    const BATCH = 32;
    for (let i = 0; i < texts.length; i += BATCH) {
      const slice = texts.slice(i, i + BATCH);
      const body = {
        requests: slice.map((text) => ({
          model: 'models/text-embedding-004',
          content: { parts: [{ text }] },
        })),
      };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Gemini embeddings error: ${res.status} ${t}`);
      }
      const json: GeminiEmbeddingResponse = await res.json();
      if (!json.responses) {
        throw new Error('Unexpected Gemini embeddings response shape.');
      }
      for (const r of json.responses) {
        const embedding = r.embedding?.values;
        if (!embedding) throw new Error('Missing embedding in response item');
        const vec = Float32Array.from(embedding);
        if (!this._dim) this._dim = vec.length;
        outputs.push(vec);
      }
    }
    return outputs;
  }

  async dim(): Promise<number> {
    if (this._dim) return this._dim;
    const v = await this.embed(['dim-probe']);
    this._dim = v[0].length;
    return this._dim!;
  }
}

// Simple cosine similarity utilities (shared)
export function cosineSim(a: Float32Array, b: Float32Array): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i], y = b[i];
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
