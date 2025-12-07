import { createKnowledge, searchKnowledge, getKnowledge } from '@/api/generated/knowledgeApi';
import type { CreateKnowledgePayload } from '@/api/generated/knowledgeApi';

export const knowledgeService = {
  create: (payload: CreateKnowledgePayload) => createKnowledge(payload),
  search: (query: string, limit = 3) => searchKnowledge(query, limit),
  get: (filename: string) => getKnowledge(filename),
};

export default knowledgeService;
