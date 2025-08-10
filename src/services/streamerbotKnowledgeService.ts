/**
 * Streamerbot Knowledge Service
 * - Provides programmatic access to RAG snippets for Streamer.bot/Speaker.bot docs
 * - No UI in this step (per approval). UI can call these functions later.
 *
 * Exposed API:
 *  - getTopSnippets(query: string, k?: number): Promise<{ id: number; score: number; text: string }[]>
 *  - getContextBlock(query: string, k?: number): Promise<string>  // XML-ish knowledge_base_context block
 */
import { loadStreamerbotKB, searchStreamerbot, assembleContext } from '../utils/knowledgeBase';

export async function getTopSnippets(query: string, k = 5) {
  await loadStreamerbotKB();
  return searchStreamerbot(query, k);
}

export async function getContextBlock(query: string, k = 5) {
  const results = await getTopSnippets(query, k);
  // Reduce payload a bit: keep top 3 by default inside block
  const top = results
    .slice(0, Math.min(3, results.length))
    .map((r) => ({ id: r.id, text: r.text }));
  return assembleContext(top);
}
