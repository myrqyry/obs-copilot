import React, { useState, useRef } from 'react';
import { useGeminiLive } from '@/hooks/useGeminiLive';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/common/TextInput';

const LiveAPIDemo: React.FC = () => {
  const {
    isConnecting,
    isConnected,
    error,
    audioUrl,
    transcript,
    responseText,
    connect,
    disconnect,
    sendText,
    setTranscript
  } = useGeminiLive();
  
  const [inputText, setInputText] = useState('');
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleConnect = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect({
        model: 'gemini-2.5-flash-preview-native-audio-dialog',
        callbacks: {
          onopen: () => console.log('Live API connection opened'),
          onmessage: () => {}, // Required but unused in this component
          onerror: (err) => console.error('Live API error:', err),
          onclose: (event) => console.log('Live API connection closed:', event.reason),
        },
        config: {
          responseModalities: ['AUDIO' as any],
          systemInstruction: 'You are a helpful assistant. Respond in a friendly and conversational tone.'
        }
      });
    }
  };

  const handleSendText = () => {
    if (inputText.trim() && isConnected) {
      sendText(inputText);
      setTranscript(prev => prev + inputText + '\n');
      setInputText('');
    }
  };

  // Play audio when URL changes
  React.useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play().catch(err => {
        console.error('Error playing audio:', err);
      });
    }
  }, [audioUrl]);

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Button
          onClick={handleConnect}
          disabled={isConnecting}
          variant={isConnected ? 'destructive' : 'default'}
        >
          {isConnecting ? 'Connecting...' : isConnected ? 'Disconnect' : 'Connect'}
        </Button>
        {error && <p className="text-red-500">{error}</p>}
      </div>
      
      <div className="mb-4">
        <p className="font-semibold">Transcript:</p>
        <p className="whitespace-pre-wrap">{transcript}</p>
      </div>
      
      <div className="mb-4">
        <p className="font-semibold">Response:</p>
        <p>{responseText}</p>
      </div>
      
      <div className="flex gap-2 mb-4">
        <TextInput
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type your message..."
          disabled={!isConnected}
        />
        <Button onClick={handleSendText} disabled={!isConnected || !inputText.trim()}>
          Send
        </Button>
      </div>
      
      {audioUrl && (
        <audio ref={audioRef} src={audioUrl} controls />
      )}
    </div>
  );
};

export default LiveAPIDemo;
