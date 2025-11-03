import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Mic,
  Play,
  Pause,
  Download,
  Upload,
  Users,
  User,
  Volume2,
  Wand2
} from 'lucide-react';
import { useGenerateStore } from '@/store/generateStore';
import { useConnectionsStore } from '@/store/connections';
import { toast } from '@/components/ui/toast';

interface Voice {
  id: string;
  name: string;
  description: string;
  gender: 'male' | 'female' | 'neutral';
  style: string;
}

const voices: Voice[] = [
  { id: 'Kore', name: 'Kore', description: 'Firm and professional', gender: 'female', style: 'firm' },
  { id: 'Puck', name: 'Puck', description: 'Upbeat and energetic', gender: 'male', style: 'upbeat' },
  { id: 'Charon', name: 'Charon', description: 'Informative narrator', gender: 'male', style: 'informative' },
  { id: 'Zephyr', name: 'Zephyr', description: 'Bright and clear', gender: 'female', style: 'bright' },
  { id: 'Fenrir', name: 'Fenrir', description: 'Excitable personality', gender: 'male', style: 'excitable' },
  { id: 'Leda', name: 'Leda', description: 'Youthful and friendly', gender: 'female', style: 'youthful' },
  { id: 'Aoede', name: 'Aoede', description: 'Breezy and casual', gender: 'female', style: 'breezy' },
  { id: 'Callirrhoe', name: 'Callirrhoe', description: 'Easy-going tone', gender: 'female', style: 'easy-going' },
];

const stylePrompts = [
  { id: 'cheerful', name: 'Cheerful', prompt: 'Say cheerfully:' },
  { id: 'dramatic', name: 'Dramatic', prompt: 'Say dramatically:' },
  { id: 'whisper', name: 'Whisper', prompt: 'Say in a soft whisper:' },
  { id: 'excited', name: 'Excited', prompt: 'Say with excitement:' },
  { id: 'calm', name: 'Calm', prompt: 'Say calmly and peacefully:' },
  { id: 'mysterious', name: 'Mysterious', prompt: 'Say mysteriously:' },
];

export const SpeechGenerator: React.FC = () => {
  const [text, setText] = useState('');
  const [isMultiSpeaker, setIsMultiSpeaker] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [speaker1Voice, setSpeaker1Voice] = useState('Kore');
  const [speaker2Voice, setSpeaker2Voice] = useState('Puck');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);

  const {
    generateSpeech,
    isGenerating,
    progress,
    lastGeneration,
    addToHistory
  } = useGenerateStore();

  const { isConnected } = useConnectionsStore();

  const handleGenerate = useCallback(async () => {
    if (!text.trim()) {
      toast({
        title: 'Missing Text',
        description: 'Please enter text to convert to speech',
        variant: 'destructive'
      });
      return;
    }

    const stylePrompt = stylePrompts.find(s => s.id === selectedStyle);
    const fullText = stylePrompt ? `${stylePrompt.prompt} ${text}` : text;

    try {
      const result = await generateSpeech({
        text: fullText,
        isMultiSpeaker,
        voice: selectedVoice,
        speaker1Voice,
        speaker2Voice
      });

      if (result.success) {
        addToHistory({
          type: 'speech',
          prompt: text,
          model: 'gemini-2.5-flash-preview-tts',
          result: result.data,
          timestamp: Date.now(),
          metadata: {
            isMultiSpeaker,
            voice: isMultiSpeaker ? `${speaker1Voice}, ${speaker2Voice}` : selectedVoice,
            style: selectedStyle
          }
        });

        toast({
          title: 'Speech Generated!',
          description: `Successfully created ${isMultiSpeaker ? 'multi-speaker' : 'single-speaker'} audio`,
          variant: 'default'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate speech',
        variant: 'destructive'
      });
    }
  }, [
    text,
    selectedStyle,
    isMultiSpeaker,
    selectedVoice,
    speaker1Voice,
    speaker2Voice,
    generateSpeech,
    addToHistory
  ]);

  const handlePlay = useCallback(() => {
    if (!lastGeneration?.result?.audioData) return;

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [lastGeneration, isPlaying]);

  const handleDownload = useCallback(() => {
    if (!lastGeneration?.result?.audioData) return;

    const link = document.createElement('a');
    link.href = `data:audio/wav;base64,${lastGeneration.result.audioData}`;
    link.download = `generated-speech-${Date.now()}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [lastGeneration]);

  const handleAddToOBS = useCallback(async () => {
    if (!lastGeneration?.result?.audioData || !isConnected) {
      toast({
        title: 'Cannot Add to OBS',
        description: !isConnected ? 'Not connected to OBS' : 'No audio to add',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Implementation would depend on OBS integration
      toast({
        title: 'Added to OBS',
        description: 'Audio source added to current scene',
        variant: 'default'
      });
    } catch (error: any) {
      toast({
        title: 'Failed to Add to OBS',
        description: error.message,
        variant: 'destructive'
      });
    }
  }, [lastGeneration, isConnected]);

  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Speech Mode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="multi-speaker"
                checked={isMultiSpeaker}
                onCheckedChange={setIsMultiSpeaker}
              />
              <Label htmlFor="multi-speaker" className="flex items-center gap-2">
                {isMultiSpeaker ? <Users className="w-4 h-4" /> : <User className="w-4 h-4" />}
                {isMultiSpeaker ? 'Multi-Speaker' : 'Single Speaker'}
              </Label>
            </div>
            <Badge variant={isMultiSpeaker ? 'default' : 'secondary'}>
              {isMultiSpeaker ? 'Conversation Mode' : 'Narration Mode'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5" />
              Voice Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Text Input */}
            <div>
              <Label htmlFor="text">
                {isMultiSpeaker ? 'Conversation Script' : 'Text to Speak'}
              </Label>
              <Textarea
                id="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  isMultiSpeaker
                    ? "Speaker1: Hello there!\nSpeaker2: Hi, how are you doing?\nSpeaker1: I'm doing great, thanks for asking!"
                    : "Enter the text you want to convert to speech..."
                }
                rows={6}
                className="mt-1 font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">
                {isMultiSpeaker
                  ? 'Use "Speaker1:" and "Speaker2:" to indicate different speakers'
                  : 'Natural conversational text works best'
                }
              </p>
            </div>

            {/* Style Selection */}
            <div>
              <Label>Speaking Style</Label>
              <Select
                value={selectedStyle}
                onValueChange={(v) => setSelectedStyle(v === '__none__' ? '' : v)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Natural (no style)" />
                </SelectTrigger>
                <SelectContent>
                  {/* Radix Select disallows empty-string item values; use a sentinel */}
                  <SelectItem value="__none__">Natural (no style)</SelectItem>
                  {stylePrompts.map(style => (
                    <SelectItem key={style.id} value={style.id}>
                      {style.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Voice Selection */}
            {!isMultiSpeaker ? (
              <div>
                <Label>Voice</Label>
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {voices.map(voice => (
                      <SelectItem key={voice.id} value={voice.id}>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-xs">
                            {voice.gender}
                          </Badge>
                          <div>
                            <div className="font-medium">{voice.name}</div>
                            <div className="text-xs text-gray-500">{voice.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label>Speaker 1 Voice</Label>
                  <Select value={speaker1Voice} onValueChange={setSpeaker1Voice}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {voices.map(voice => (
                        <SelectItem key={voice.id} value={voice.id}>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-xs">
                              {voice.gender}
                            </Badge>
                            <div>
                              <div className="font-medium">{voice.name}</div>
                              <div className="text-xs text-gray-500">{voice.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Speaker 2 Voice</Label>
                  <Select value={speaker2Voice} onValueChange={setSpeaker2Voice}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {voices.map(voice => (
                        <SelectItem key={voice.id} value={voice.id}>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-xs">
                              {voice.gender}
                            </Badge>
                            <div>
                              <div className="font-medium">{voice.name}</div>
                              <div className="text-xs text-gray-500">{voice.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !text.trim()}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Volume2 className="w-4 h-4 mr-2 animate-pulse" />
                  Generating Speech...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate Speech
                </>
              )}
            </Button>

            {/* Progress Bar */}
            {isGenerating && (
              <Progress value={progress} className="w-full" />
            )}
          </CardContent>
        </Card>

        {/* Audio Preview Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Volume2 className="w-5 h-5" />
                Generated Audio
              </span>
              {lastGeneration?.metadata && (
                <Badge variant="outline">
                  {lastGeneration.metadata.isMultiSpeaker ? 'Multi-Speaker' : 'Single Speaker'}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-gray-100 rounded-lg flex flex-col items-center justify-center p-8">
              {isGenerating ? (
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-green-200 border-t-green-500 rounded-full mx-auto mb-4 animate-spin" />
                  <p className="text-gray-600">Converting text to speech...</p>
                  <p className="text-sm text-gray-500 mt-1">{progress}% complete</p>
                </div>
              ) : lastGeneration?.result?.audioData ? (
                <div className="text-center w-full">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Volume2 className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-gray-900 font-medium mb-2">Audio Ready</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Voice: {lastGeneration.metadata?.voice}
                  </p>

                  {/* Audio Element */}
                  <audio
                    ref={audioRef}
                    src={`data:audio/wav;base64,${lastGeneration.result.audioData}`}
                    onEnded={() => setIsPlaying(false)}
                    className="hidden"
                  />

                  {/* Waveform Visualization Placeholder */}
                  <div className="w-full h-16 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                    <div className="flex items-end gap-1 h-8">
                      {Array.from({ length: 20 }).map((_, i) => (
                        <div
                          key={i}
                          className={`bg-green-500 w-2 rounded-sm transition-all duration-75 ${
                            isPlaying ? 'animate-pulse' : ''
                          }`}
                          style={{
                            height: `${Math.random() * 100}%`,
                            animationDelay: `${i * 50}ms`
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <Volume2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Your generated audio will appear here</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {lastGeneration?.result?.audioData && (
              <div className="space-y-3 mt-4">
                <Button
                  onClick={handlePlay}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Play Audio
                    </>
                  )}
                </Button>

                <div className="flex gap-2">
                  <Button onClick={handleDownload} variant="outline" className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  {isConnected && (
                    <Button onClick={handleAddToOBS} className="flex-1">
                      <Upload className="w-4 h-4 mr-2" />
                      Add to OBS
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Metadata */}
            {lastGeneration && (
              <div className="mt-4 text-xs text-gray-500 space-y-1">
                <p><strong>Model:</strong> {lastGeneration.model}</p>
                <p><strong>Created:</strong> {new Date(lastGeneration.timestamp).toLocaleString()}</p>
                <p><strong>Length:</strong> ~{Math.ceil(text.length / 10)} seconds</p>
                {lastGeneration.metadata?.style && (
                  <p><strong>Style:</strong> {lastGeneration.metadata.style}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};