// src/services/aiService.ts
export interface OBSAwareQueryRequest {
  prompt: string;
  model?: string;
  obs_state: {
    current_scene: string;
    available_scenes: string[];
    active_sources: any[];
    streaming_status: boolean;
    recording_status: boolean;
    recent_commands: any[];
  };
  use_explicit_cache?: boolean;
  cache_ttl_minutes?: number;
}

export class AIService {
  async queryWithOBSContext(request: OBSAwareQueryRequest) {
    const response = await fetch('/api/gemini/obs-aware-query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`AI query failed: ${response.statusText}`);
    }

    return await response.json();
  }

  async cleanupCaches() {
    const response = await fetch('/api/gemini/cache/cleanup', {
      method: 'POST'
    });
    return await response.json();
  }
}

export const aiService = new AIService();