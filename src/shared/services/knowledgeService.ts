import { createKnowledge, searchKnowledge, getKnowledge } from '@/api/generated/knowledgeApi';
import type { CreateKnowledgePayload } from '@/api/generated/knowledgeApi';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const KNOWLEDGE_KEYS = {
  all: ['knowledge'] as const,
  lists: () => [...KNOWLEDGE_KEYS.all, 'list'] as const,
  list: (query: string, limit: number) => [...KNOWLEDGE_KEYS.lists(), { query, limit }] as const,
  details: () => [...KNOWLEDGE_KEYS.all, 'detail'] as const,
  detail: (filename: string) => [...KNOWLEDGE_KEYS.details(), filename] as const,
};

export const useCreateKnowledge = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateKnowledgePayload) => createKnowledge(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KNOWLEDGE_KEYS.all }),
  });
};

export const useSearchKnowledge = (query: string, limit = 3) => {
  return useQuery({
    queryKey: KNOWLEDGE_KEYS.list(query, limit),
    queryFn: () => searchKnowledge(query, limit),
    enabled: Boolean(query && query.trim().length > 0),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
};

export const useKnowledge = (filename: string) =>
  useQuery({
    queryKey: KNOWLEDGE_KEYS.detail(filename),
    queryFn: () => getKnowledge(filename),
    enabled: Boolean(filename),
    staleTime: 1000 * 60 * 10,
  });

export const knowledgeService = {
  create: (payload: CreateKnowledgePayload) => createKnowledge(payload),
  search: (query: string, limit = 3) => searchKnowledge(query, limit),
  get: (filename: string) => getKnowledge(filename),
};

export default knowledgeService;
