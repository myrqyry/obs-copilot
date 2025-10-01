import { useState, useCallback, useRef } from 'react';
import { useLifecycleManagement } from './useLifecycleManagement';
import { geminiService } from '@/services/geminiService';
import { logger } from '@/utils/logger';
import { LiveServerMessage, LiveConnectParameters } from '@google/genai';

export const useGeminiLive = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [responseText, setResponseText] = useState<string>('');
  const audioChunksRef = useRef<Uint8Array[]>([]);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize AudioContext on user interaction
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  const connect = useCallback(async (config: LiveConnectParameters) => {
    if (isConnecting || isConnected) return;
    
    setIsConnecting(true);
    setError(null);
    audioChunksRef.current = [];
    
    try {
      sessionRef.current = await geminiService.liveConnect({
        ...config,
        callbacks: {
          ...config.callbacks,
          onmessage: (message: LiveServerMessage) => {
            if (message.data) {
              // Handle audio data
              const chunk = Uint8Array.from(atob(message.data), c => c.charCodeAt(0));
              audioChunksRef.current.push(chunk);
              updateAudio();
            }
            
            if (message.serverContent?.modelTurn?.parts) {
              // Handle text response
              const textParts = message.serverContent.modelTurn.parts
                .filter(part => !('inlineData' in part))
                .map(part => (part as any).text || '')
                .join('');
              
              if (textParts) {
                setResponseText(prev => prev + textParts);
              }
            }
            
            config.callbacks.onmessage?.(message);
          }
        }
      });
      
      setIsConnected(true);
    } catch (err: any) {
      logger.error('Live API connection error:', err);
      setError(err.message || 'Failed to connect to Live API');
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, isConnected]);

  const disconnect = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    setIsConnected(false);
    setTranscript('');
    setResponseText('');
    audioChunksRef.current = [];
  }, []);

  const sendAudio = useCallback((audioData: ArrayBuffer) => {
    if (!sessionRef.current || !isConnected) return;
    
    try {
      sessionRef.current.sendRealtimeInput({
        audio: {
          data: btoa(String.fromCharCode(...new Uint8Array(audioData))),
          mimeType: 'audio/pcm;rate=16000'
        }
      });
    } catch (err: any) {
      logger.error('Error sending audio:', err);
      setError(err.message || 'Failed to send audio');
    }
  }, [isConnected]);

  const sendText = useCallback((text: string) => {
    if (!sessionRef.current || !isConnected) return;
    
    try {
      sessionRef.current.sendRealtimeInput({
        text
      });
    } catch (err: any) {
      logger.error('Error sending text:', err);
      setError(err.message || 'Failed to send text');
    }
  }, [isConnected]);

  const updateAudio = useCallback(() => {
    if (audioChunksRef.current.length === 0) return;
    
    try {
      initAudioContext();
      
      // Combine all audio chunks
      const totalLength = audioChunksRef.current.reduce((acc, chunk) => acc + chunk.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      
      for (const chunk of audioChunksRef.current) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }
      
      audioChunksRef.current = [];
      
      // Create WAV file from PCM data
      const wavBuffer = pcmToWav(combined, 24000);
      const blob = new Blob([wavBuffer], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    } catch (err) {
      logger.error('Error processing audio:', err);
    }
  }, []);

  // Convert PCM to WAV format
  const pcmToWav = (pcmData: Uint8Array, sampleRate: number): ArrayBuffer => {
    const buffer = new ArrayBuffer(44 + pcmData.length);
    const view = new DataView(buffer);
    
    // Write WAV header
    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + pcmData.length, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // chunk size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, 1, true); // mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // byte rate
    view.setUint16(32, 2, true); // block align
    view.setUint16(34, 16, true); // bits per sample
    writeString(36, 'data');
    view.setUint32(40, pcmData.length, true);
    
    // Write PCM data
    const data = new Uint8Array(buffer, 44);
    data.set(pcmData);
    
    return buffer;
  };

  useLifecycleManagement({
    onUnmount: () => {
      disconnect();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    },
    dependencies: [audioUrl, disconnect],
  });

  return {
    isConnecting,
    isConnected,
    error,
    audioUrl,
    transcript,
    responseText,
    connect,
    disconnect,
    sendAudio,
    sendText,
    setTranscript
  };
};
