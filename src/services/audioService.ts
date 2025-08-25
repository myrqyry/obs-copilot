import { logger } from '../utils/logger';
import { httpClient } from './httpClient';
import {
  TTSRequest,
  TTSResponse,
  MultiSpeakerTTSRequest,
  MultiSpeakerTTSResponse,
  MusicGenerationRequest,
  MusicGenerationResponse,
  MusicSteeringRequest,
  MusicSteeringResponse,
} from '../types/audio';

export class AudioService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/gemini';
  }

  // Legacy method for backward compatibility
  async generateAudio(text: string): Promise<string> {
    const response = await this.generateTTS({ text });
    return response.audio;
  }

  // Enhanced TTS using Gemini 2.5 Flash Preview TTS
  async generateTTS(request: TTSRequest): Promise<TTSResponse> {
    try {
      const response = await httpClient.post<TTSResponse>(
        `${this.baseUrl}/generate-tts`,
        request
      );

      if (!response.data.audio) {
        logger.error('No audio content returned from Gemini TTS API');
        throw new Error('No audio content returned from Gemini TTS API');
      }

      return response.data;
    } catch (error) {
      logger.error('Error generating TTS via Gemini:', error);
      throw new Error(
        `Failed to generate TTS: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // Multi-speaker conversation TTS
  async generateMultiSpeakerTTS(request: MultiSpeakerTTSRequest): Promise<MultiSpeakerTTSResponse> {
    try {
      const response = await httpClient.post<MultiSpeakerTTSResponse>(
        `${this.baseUrl}/generate-multi-speaker-tts`,
        request
      );

      if (!response.data.audio) {
        logger.error('No audio content returned from Gemini multi-speaker TTS API');
        throw new Error('No audio content returned from Gemini multi-speaker TTS API');
      }

      return response.data;
    } catch (error) {
      logger.error('Error generating multi-speaker TTS via Gemini:', error);
      throw new Error(
        `Failed to generate multi-speaker TTS: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // Music generation using Lyria RealTime
  async generateMusic(request: MusicGenerationRequest): Promise<MusicGenerationResponse> {
    try {
      const response = await httpClient.post<MusicGenerationResponse>(
        `${this.baseUrl}/generate-music`,
        request
      );

      if (!response.data.audio) {
        logger.error('No audio content returned from Gemini music generation API');
        throw new Error('No audio content returned from Gemini music generation API');
      }

      return response.data;
    } catch (error) {
      logger.error('Error generating music via Gemini:', error);
      throw new Error(
        `Failed to generate music: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // Music steering for real-time adjustments
  async steerMusic(request: MusicSteeringRequest): Promise<MusicSteeringResponse> {
    try {
      const response = await httpClient.post<MusicSteeringResponse>(
        `${this.baseUrl}/steer-music`,
        request
      );

      if (!response.data.audio) {
        logger.error('No audio content returned from Gemini music steering API');
        throw new Error('No audio content returned from Gemini music steering API');
      }

      return response.data;
    } catch (error) {
      logger.error('Error steering music via Gemini:', error);
      throw new Error(
        `Failed to steer music: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // WebSocket connection for real-time music streaming
  connectMusicStream(sessionId: string): WebSocket {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}${this.baseUrl}/music-stream/${sessionId}`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      logger.info('Connected to music streaming session:', sessionId);
    };

    ws.onerror = (error) => {
      logger.error('Music streaming WebSocket error:', error);
    };

    ws.onclose = () => {
      logger.info('Music streaming connection closed for session:', sessionId);
    };

    return ws;
  }

  // Audio playback utilities
  async playAudio(audioDataUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(audioDataUrl);

      audio.onended = () => resolve();
      audio.onerror = (error) => reject(error);

      audio.play().catch(reject);
    });
  }

  // Audio caching for performance
  private audioCache = new Map<string, string>();

  async getCachedAudio(key: string, generator: () => Promise<string>): Promise<string> {
    if (this.audioCache.has(key)) {
      return this.audioCache.get(key)!;
    }

    const audio = await generator();
    this.audioCache.set(key, audio);

    // Limit cache size
    if (this.audioCache.size > 10) {
      const firstKey = this.audioCache.keys().next().value;
      if (firstKey) {
        this.audioCache.delete(firstKey);
      }
    }

    return audio;
  }

  // Voice and language utilities
  getAvailableVoices(): string[] {
    // This would ideally come from the backend, but for now using static list
    return [
      "Kore", "Puck", "Zephyr", "Aurora", "Nova", "Sage", "Luna", "River",
      "Echo", "Phoenix", "Rosa", "Carlos", "Sophie", "Pierre", "Anna", "Hans",
      "Gina", "Marco", "Lila", "Pedro", "Hana", "Ken", "Min", "Jun",
      "Li", "Wang", "Priya", "Raj", "Layla", "Ahmed", "Jazz", "Rock",
      "Classical", "Storyteller", "Newscaster", "Teacher"
    ];
  }

  getAvailableLanguages(): string[] {
    return [
      "en", "es", "fr", "de", "it", "pt", "ja", "ko", "zh", "hi", "ar"
    ];
  }

  // Music utilities
  getAvailableScales(): string[] {
    return [
      "C Major", "C Minor", "C# Major", "C# Minor", "D Major", "D Minor",
      "D# Major", "D# Minor", "E Major", "E Minor", "F Major", "F Minor",
      "F# Major", "F# Minor", "G Major", "G Minor", "G# Major", "G# Minor",
      "A Major", "A Minor", "A# Major", "A# Minor", "B Major", "B Minor"
    ];
  }

  // Audio format conversion (if needed)
  async convertAudioFormat(audioDataUrl: string, targetFormat: 'wav' | 'mp3' = 'wav'): Promise<string> {
    // For now, assume the API returns the correct format
    // In a real implementation, you might need format conversion here
    if (audioDataUrl.includes(`audio/${targetFormat}`)) {
      return audioDataUrl;
    }

    // Placeholder for format conversion logic
    logger.warn('Audio format conversion not implemented yet');
    return audioDataUrl;
  }

  // Cleanup method
  dispose(): void {
    this.audioCache.clear();
  }
}
