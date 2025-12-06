import React, { useState } from 'react';
import { geminiService } from '@/shared/services/geminiService';
import { createToastError } from '@/shared/lib/errorUtils';
import { toast } from '@/shared/components/ui/toast';
import { Loader2, Play, Download } from 'lucide-react';

interface Speaker {
  id: string;
  name: string;
  voice: string;
}

const VOICES = [
  'Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir', 'Leda', 'Orus', 'Aoede', 'Callirrhoe',
  'Autonoe', 'Enceladus', 'Iapetus', 'Umbriel', 'Algieba', 'Despina', 'Erinome',
  'Algenib', 'Rasalgethi', 'Laomedeia', 'Achernar', 'Alnilam', 'Schedar', 'Gacrux',
  'Pulcherrima', 'Achird', 'Zubenelgenubi', 'Vindemiatrix', 'Sadachbia', 'Sadaltager', 'Sulafat'
];

const SpeechGeneration: React.FC = () => {
  const [script, setScript] = useState('Alice: Hello, Bob!\nBob: Hi Alice, how are you?\nAlice: I am great, thanks!');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'single' | 'multi'>('single');
  const [selectedVoice, setSelectedVoice] = useState<string>('Kore');
  const [speakers, setSpeakers] = useState<Speaker[]>([
    { id: '1', name: 'Alice', voice: 'Zephyr' },
    { id: '2', name: 'Bob', voice: 'Puck' }
  ]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const handleAddSpeaker = () => {
    if (speakers.length >= 2) return; // Limit to 2 speakers for now as per some examples, though API might support more
    const newId = (speakers.length + 1).toString();
    setSpeakers([...speakers, { id: newId, name: `Speaker ${newId}`, voice: 'Kore' }]);
  };

  const handleRemoveSpeaker = (id: string) => {
    setSpeakers(speakers.filter(s => s.id !== id));
  };

  const handleSpeakerChange = (id: string, field: keyof Speaker, value: string) => {
    setSpeakers(speakers.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleGenerateAudio = async () => {
    if (!script.trim()) {
      setError('Please enter a script or prompt.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAudioUrl(null);
    
    try {
      let options: any = {};
      
      if (mode === 'multi') {
        options.multiSpeakerVoiceConfig = {
          speakers: speakers.map(s => ({ name: s.name, voice: s.voice }))
        };
      } else {
        options.voiceConfig = {
          voice_name: selectedVoice
        };
      }

      const url = await geminiService.generateSpeech(script, options);
      setAudioUrl(url);
      toast({
        title: 'Success',
        description: 'Audio generated successfully.',
      });
    } catch (err: any) {
      const msg = createToastError('Speech Generation', err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">Speech Generation</h2>
        <p className="text-sm text-muted-foreground">
          Generate lifelike speech using Gemini Native TTS. Control style, pace, and tone with your prompt.
        </p>
      </div>

      {/* Mode Selection */}
      <div className="flex space-x-4 border-b pb-2">
        <button
          className={`pb-2 text-sm font-medium ${mode === 'single' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setMode('single')}
        >
          Single Speaker
        </button>
        <button
          className={`pb-2 text-sm font-medium ${mode === 'multi' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setMode('multi')}
        >
          Multi-Speaker
        </button>
      </div>
      
      {/* Configuration */}
      <div className="space-y-4">
        {mode === 'single' ? (
          <div className="space-y-2">
            <label className="block text-sm font-medium">Voice</label>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="w-full p-2 border rounded bg-background"
              disabled={isLoading}
            >
              {VOICES.map((voice) => (
                <option key={voice} value={voice}>{voice}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium">Speakers</label>
              {speakers.length < 2 && (
                <button onClick={handleAddSpeaker} className="text-xs text-primary hover:underline">
                  + Add Speaker
                </button>
              )}
            </div>
            {speakers.map((speaker) => (
              <div key={speaker.id} className="flex gap-2 items-center p-2 border rounded bg-muted/20">
                <input
                  type="text"
                  value={speaker.name}
                  onChange={(e) => handleSpeakerChange(speaker.id, 'name', e.target.value)}
                  placeholder="Name (e.g., Alice)"
                  className="flex-1 p-1 text-sm border rounded"
                />
                <select
                  value={speaker.voice}
                  onChange={(e) => handleSpeakerChange(speaker.id, 'voice', e.target.value)}
                  className="flex-1 p-1 text-sm border rounded"
                >
                  {VOICES.map((voice) => (
                    <option key={voice} value={voice}>{voice}</option>
                  ))}
                </select>
                {speakers.length > 1 && (
                  <button 
                    onClick={() => handleRemoveSpeaker(speaker.id)}
                    className="text-destructive hover:text-destructive/80 px-2"
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Ensure your script uses these names (e.g., "{speakers[0]?.name}: Hello") to assign lines.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-medium">Script / Prompt</label>
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            className="w-full p-2 border rounded min-h-[150px] font-mono text-sm"
            placeholder={mode === 'multi' 
              ? "Alice: Hello there!\nBob: Hi Alice, good to see you." 
              : "Say cheerfully: Welcome to our broadcast!"}
          />
        </div>
      </div>
      
      {/* Actions */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleGenerateAudio}
          disabled={isLoading || !script.trim()}
          className={`w-full py-2 px-4 rounded-md flex items-center justify-center gap-2 ${
            isLoading || !script.trim()
              ? 'bg-muted text-muted-foreground cursor-not-allowed' 
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          } transition-colors`}
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {isLoading ? 'Generating...' : 'Generate Audio'}
        </button>
      </div>
      
      {/* Result */}
      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded border border-destructive/20">
          {error}
        </div>
      )}

      {audioUrl && (
        <div className="p-4 border rounded bg-muted/10 space-y-3">
          <h3 className="text-sm font-medium">Generated Audio</h3>
          <audio controls src={audioUrl} className="w-full" />
          <div className="flex justify-end">
            <a 
              href={audioUrl} 
              download={`speech-${Date.now()}.wav`}
              className="text-xs flex items-center gap-1 text-primary hover:underline"
            >
              <Download className="w-3 h-3" /> Download WAV
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpeechGeneration;
