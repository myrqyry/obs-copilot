/**
 * Runtime knowledge base utilities for Streamer.bot docs corpus.
 * Loads:
 *   - src/knowledge/streamerbot/index.json
 *   - src/knowledge/streamerbot/vectors.bin
 * Provides:
 *   - loadStreamerbotKB(): loads metadata and vectors
 *   - searchStreamerbot(query, k): returns top-k snippets with scores
 *   - assembleContext(snippets): formats into a knowledge_base_context block
 *
 * Notes:
 * - Designed to run in the Vite/TS environment of this app.
 * - index.json is imported statically; vectors.bin fetched at runtime.
 * - Embedding provider is configured via EMBEDDINGS_PROVIDER or VITE_EMBEDDINGS_PROVIDER.
 */
import { createEmbedder, cosineSim, getProvider } from './embeddings';

// Vite will bundle JSON imports if using assert { type: 'json' } in modern envs, but here we
// load at runtime via fetch to avoid bundling heavy artifacts. Keep small metadata in JSON file.
type IndexJson = {
  source: 'streamerbot-docs';
  provider: string;
  dim: number;
  chunks: { id: number; preview: string; length: number }[];
};

export type KBSearchResult = {
  id: number;
  score: number;
  text: string;
};

let kbIndex: IndexJson | null = null;
let vectors: Float32Array | null = null;
const chunkTexts: string[] | null = null; // lazily populated from the source .txt slices if needed

const INDEX_URL = '/src/knowledge/streamerbot/index.json';
const VECTORS_URL = '/src/knowledge/streamerbot/vectors.bin';

// Because index.json only stores preview/length, we keep full texts outside the bundle to minimize size.
// For now, we will reconstruct snippets from previews, which is sufficient for context injection.
// If you need full text, extend the ingestion to write chunkTexts.json and load here.

async function fetchIndex(): Promise<IndexJson> {
  const res = await fetch(INDEX_URL);
  if (!res.ok) throw new Error(`Failed to fetch KB index.json: ${res.status}`);
  return res.json();
}

async function fetchVectors(expectedDim: number, expectedCount: number): Promise<Float32Array> {
  const res = await fetch(VECTORS_URL);
  if (!res.ok) throw new Error(`Failed to fetch KB vectors.bin: ${res.status}`);
  const buf = await res.arrayBuffer();
  const floats = new Float32Array(buf);
  if (floats.length % expectedDim !== 0) {
    // Ingest mismatch
    console.warn('KB vectors dim mismatch, proceeding best-effort');
  }
  const count = Math.floor(floats.length / expectedDim);
  if (expectedCount && count !== expectedCount) {
    console.warn(`KB vectors count mismatch. expected=${expectedCount} actual=${count}`);
  }
  return floats;
}

export async function loadStreamerbotKB(): Promise<void> {
  if (kbIndex && vectors) return;
  kbIndex = await fetchIndex();
  vectors = await fetchVectors(kbIndex.dim, kbIndex.chunks.length);
}

/**
 * Embed the query and compute cosine similarity against all chunk vectors.
 * Returns top-k results with short text payload assembled from preview.
 */
export async function searchStreamerbot(query: string, k = 5): Promise<KBSearchResult[]> {
  if (!kbIndex || !vectors) {
    await loadStreamerbotKB();
  }
  if (!kbIndex || !vectors) throw new Error('Failed to load knowledge base');

  const embedder = await createEmbedder(getProvider());
  const [qVec] = await embedder.embed([query]);

  const dim = kbIndex.dim;
  const totalChunks = Math.floor(vectors.length / dim);

  const top: { id: number; score: number }[] = [];
  for (let i = 0; i < totalChunks; i++) {
    const start = i * dim;
    const chunkVec = vectors.subarray(start, start + dim);
    const score = cosineSim(qVec, chunkVec);
    // maintain sorted top-k
    if (top.length < k) {
      top.push({ id: i, score });
      top.sort((a, b) => b.score - a.score);
    } else if (score > top[top.length - 1].score) {
      top[top.length - 1] = { id: i, score };
      top.sort((a, b) => b.score - a.score);
    }
  }

  // Build small snippets: use preview plus score
  const results: KBSearchResult[] = top.map(({ id, score }) => {
    const meta = kbIndex!.chunks[id];
    const text = meta?.preview || '';
    return { id, score, text };
  });

  return results;
}

/**
 * Formats snippets into a knowledge_base_context block.
 * Caller can prepend this to Gemini prompt.
 */
export function assembleContext(snippets: { id: number; text: string }[]): string {
  const docs = snippets
    .map((s) => `<document source="streamerbot-docs#${s.id}">\n${s.text}\n</document>`)
    .join('\n\n');
  return `<knowledge_base_context>\n${docs}\n</knowledge_base_context>`;
}
