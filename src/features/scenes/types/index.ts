/**
 * Represents the context of the current stream, which can be used
 * to provide more accurate scene suggestions.
 */
export interface StreamContext {
  /** The title of the current stream */
  streamTitle: string;
  /** The current game or category being streamed */
  category: string;
  /** Tags associated with the stream */
  tags: string[];
  /** The current number of viewers */
  viewerCount: number;
}

/**
 * Represents a single scene transition suggestion from the AI service.
 */
export interface SceneSuggestion {
  /** The name of the suggested scene to transition to */
  sceneName: string;
  /** The AI's confidence in this suggestion (0 to 1) */
  confidence: number;
  /** The reasoning behind the suggestion */
  reasoning: string;
  /** The optimal timing for the transition, in seconds from now */
  optimalTiming: number;
}