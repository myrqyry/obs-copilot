import { apiClient } from '@/api/client';
import type { KnowledgeSnippet } from '@/shared/services/searchKnowledgeBase';

export interface CreateKnowledgePayload {
  title: string;
  content: string;
  tags?: string[];
}

export async function createKnowledge(payload: CreateKnowledgePayload): Promise<KnowledgeSnippet> {
  const res = await apiClient.post('/api/knowledge', payload);
  return res.data;
}

export async function searchKnowledge(query: string, limit = 3): Promise<KnowledgeSnippet[]> {
  const res = await apiClient.get('/api/knowledge/search', { params: { query, limit } });
  return res.data;
}

export async function getKnowledge(filename: string): Promise<KnowledgeSnippet> {
  const res = await apiClient.get(`/api/knowledge/${encodeURIComponent(filename)}`);
  return res.data;
}
