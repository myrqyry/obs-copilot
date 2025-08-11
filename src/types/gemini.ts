export interface GeminiContentPart {
  text: string;
}

export interface GeminiContent {
  parts: GeminiContentPart[];
  role: string;
}

export interface GeminiSafetyRating {
  category: string;
  probability: string;
}

export interface GeminiCandidate {
  content: GeminiContent;
  finishReason: string;
  index: number;
  safetyRatings: GeminiSafetyRating[];
}

export interface GeminiPromptFeedback {
  safetyRatings: GeminiSafetyRating[];
}

export interface GeminiGenerateContentResponse {
  candidates: GeminiCandidate[];
  promptFeedback: GeminiPromptFeedback;
  audioData?: string;
}
