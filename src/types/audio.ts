export interface ImageGenerationRequest {
  prompt: string;
  model?: string;
  size?: string;
}

export interface EnhancedImageGenerationRequest {
  prompt: string;
  model?: string;
  responseModalities?: string[];
  imageFormat?: string;
  imageQuality?: number;
  aspectRatio?: string;
  personGeneration?: string;
  safetySettings?: Array<{
    category: string;
    threshold: string;
  }>;
  imageInput?: string; // Base64 encoded image for editing
  imageInputMimeType?: string;
}

export interface ImageGenerationResponse {
  images: Array<{
    data: string; // Base64 encoded image
    mime_type: string;
    width?: number;
    height?: number;
  }>;
  model: string;
  prompt: string;
  config: {
    imageFormat?: string;
    aspectRatio?: string;
    personGeneration?: string;
    responseModalities?: string[];
  };
  usage?: {
    prompt_token_count?: number;
    candidates_token_count?: number;
    total_token_count?: number;
  };
}

export interface ImageEditRequest {
  prompt: string;
  imageData: string; // Base64 encoded input image
  mimeType: string;
  model?: string;
  responseModalities?: string[];
  imageFormat?: string;
  aspectRatio?: string;
}

export interface ImageEditResponse {
  editedImage: string; // Base64 encoded edited image
  mime_type: string;
  originalPrompt: string;
  editPrompt: string;
  usage?: {
    prompt_token_count?: number;
    candidates_token_count?: number;
    total_token_count?: number;
  };
}

export const IMAGE_FORMATS = [
  { value: 'png', label: 'PNG', description: 'Lossless, supports transparency' },
  { value: 'jpeg', label: 'JPEG', description: 'Compressed, smaller file size' }
] as const;

export const ASPECT_RATIOS = [
  { value: '1:1', label: 'Square (1:1)', description: 'Perfect square' },
  { value: '4:3', label: 'Standard (4:3)', description: 'Classic photo format' },
  { value: '16:9', label: 'Widescreen (16:9)', description: 'HD video format' },
  { value: '3:4', label: 'Portrait (3:4)', description: 'Vertical photo format' },
  { value: '9:16', label: 'Vertical (9:16)', description: 'Mobile video format' }
] as const;

export const PERSON_GENERATION_OPTIONS = [
  { value: 'allow_adult', label: 'Allow All', description: 'No restrictions on generated content' },
  { value: 'block_some', label: 'Block Some', description: 'Block some adult content' },
  { value: 'block_all', label: 'Block All', description: 'Block all adult content' }
] as const;

export const RESPONSE_MODALITIES = [
  { value: 'TEXT', label: 'Text', description: 'Include text response' },
  { value: 'IMAGE', label: 'Image', description: 'Include generated image' }
] as const;

export interface ImageUploadResult {
  data: string; // Base64 encoded
  mimeType: string;
  fileName: string;
  size: number;
  width?: number;
  height?: number;
}

export interface TTSRequest {
  text: string;
  voice?: string;
  language?: string;
  model?: string;
  // Placeholder for additional TTS options (e.g., pitch, rate)
  options?: Record<string, any>;
}

export interface TTSResponse {
  audio: string; // Data URL or path to audio file (required by services)
  mimeType?: string;
  durationSeconds?: number;
  // Additional metadata placeholder
  metadata?: Record<string, any>;
}

export interface MultiSpeakerTTSRequest {
  // Array of turns in the conversation with speaker ids/names and text
  conversation: Array<{ speaker: string; text: string }>;
  // Optional mapping of speaker -> voice name
  voices?: Record<string, string>;
  language?: string;
  model?: string;
  options?: Record<string, any>;
}

export interface MultiSpeakerTTSResponse {
  audio: string;
  // Optional segments with speaker timing info
  segments?: Array<{ speaker: string; start?: number; end?: number }>;
  metadata?: Record<string, any>;
}

export interface MusicGenerationConfig {
  tempo?: number;
  key?: string;
  scale?: string;
  durationSeconds?: number;
  instruments?: string[];
  geminiApiKey?: string;
  // Placeholder for additional generation parameters
  [key: string]: any;
}

export interface MusicGenerationRequest {
  prompt: string;
  config?: MusicGenerationConfig;
  seed?: number;
  model?: string;
  sessionId?: string; // optional session identifier to tie to MusicSession
}

export interface MusicGenerationResponse {
  audio: string;
  sessionId?: string;
  config?: MusicGenerationConfig;
  metadata?: Record<string, any>;
}

export interface MusicSteeringRequest {
  sessionId: string;
  adjustments: Partial<{
    tempo: number;
    key: string;
    energy: number;
    instrumentation: string[];
  }>;
  timestamp?: number;
  // Placeholder for other steering controls
  [key: string]: any;
}

export interface MusicSteeringResponse {
  audio: string;
  sessionId?: string;
  applied: boolean;
  metadata?: Record<string, any>;
}

export interface MusicSession {
  id: string;
  createdAt?: string;
  status?: 'initialized' | 'running' | 'stopped' | 'error';
  // Backend WebSocket url or token if needed
  streamUrl?: string;
  // Placeholder for session details
  [key: string]: any;
}
