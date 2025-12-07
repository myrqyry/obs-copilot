export interface KnowledgeEntry {
  source: string;
  title: string;
  content: string;
  relevance: number;
  tags?: string[];
}

export interface CreateKnowledgePayload {
  title: string;
  content: string;
  tags?: string[];
}

export interface KnowledgeError {
  detail: string;
  code: string;
  request_id: string;
  timestamp: string;
  errors?: Array<{
    field?: string;
    message: string;
    type: string;
  }>;
}
