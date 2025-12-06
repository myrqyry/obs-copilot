import { AIService } from '@/shared/types/ai';
import { geminiService } from '@/shared/services/geminiService';
import { StreamMetrics, StreamInsights } from '../types';

class StreamAnalytics {
  private metrics: StreamMetrics = {
    viewerCount: 0,
    chatActivity: [],
    sceneTransitions: [],
    streamHealth: {
        bitrate: 0,
        fps: 0,
        droppedFrames: 0,
    },
  };

  private trackingInterval: NodeJS.Timeout | null = null;

  constructor(private aiService: AIService) {}

  public startTracking() {
    if (this.trackingInterval) {
      console.warn("Analytics tracking is already running.");
      return;
    }
    // Collect metrics every 30 seconds
    this.trackingInterval = setInterval(() => {
      this.collectMetrics();
      this.analyzePatterns();
    }, 30000);
    console.log("Stream analytics tracking started.");
  }

  public stopTracking() {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
      console.log("Stream analytics tracking stopped.");
    }
  }

  private collectMetrics() {
    // In a real application, this method would integrate with OBS, Twitch, etc.
    // to update the this.metrics object with fresh data.
    console.log("Collecting stream metrics...", this.metrics);
  }

  private analyzePatterns() {
    // This method could perform local analysis before deciding to call the AI
    console.log("Analyzing stream patterns...");
  }

  async generateInsights(): Promise<StreamInsights> {
    const prompt = `
    Analyze the following streaming metrics and provide actionable insights for improvement.
    Focus on viewer engagement, scene transition pacing, and stream health.

    Metrics: ${JSON.stringify(this.metrics, null, 2)}

    Provide insights, recommendations, and optimization opportunities.
    `;

    const response = await this.aiService.generateStructuredContent(prompt, {
      type: 'object',
      properties: {
        insights: {
            type: 'array',
            items: { type: 'string' },
            description: 'Key observations about the stream based on the data.'
        },
        recommendations: {
            type: 'array',
            items: { type: 'string' },
            description: 'Specific, actionable recommendations for the streamer.'
        },
        optimizationOpportunities: {
            type: 'array',
            items: { type: 'string' },
            description: 'Areas where the stream could be technically or strategically improved.'
        }
      },
      required: ['insights', 'recommendations', 'optimizationOpportunities']
    });

    if (response && response.structuredData) {
        return response.structuredData as StreamInsights;
    }

    throw new Error("Failed to generate stream insights from AI service.");
  }
}

// Export a singleton instance for use throughout the application
export const streamAnalytics = new StreamAnalytics(geminiService);