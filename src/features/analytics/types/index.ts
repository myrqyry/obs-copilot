/**
 * Represents the raw metrics collected during a stream.
 */
export interface StreamMetrics {
  viewerCount: number;
  chatActivity: Array<{ timestamp: number; messageCount: number }>;
  sceneTransitions: Array<{ from: string; to: string; timestamp: number }>;
  streamHealth: {
    bitrate: number;
    fps: number;
    droppedFrames: number;
  };
}

/**
 * Represents the AI-generated insights based on stream metrics.
 */
export interface StreamInsights {
  insights: string[];
  recommendations: string[];
  optimizationOpportunities: string[];
}