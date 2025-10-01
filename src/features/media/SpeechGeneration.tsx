import React, { useState } from 'react';

interface Speaker {
  id: string;
  name: string;
  voice: string;
}

const SpeechGeneration: React.FC = () => {
  const [script, setScript] = useState('Alice: Hello, Bob!\nBob: Hi Alice, how are you?\nAlice: I am great, thanks!');
  const [pitch, setPitch] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [speakers] = useState<Speaker[]>([
    { id: '1', name: 'Alice', voice: 'Zephyr' },
    { id: '2', name: 'Bob', voice: 'Puck' }
  ]);
  const [selectedVoice, setSelectedVoice] = useState<string>('Zephyr');

  const handleGenerateAudio = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Generating audio with:', { script, pitch, volume, voice: selectedVoice });
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err) {
      setError('Failed to generate audio. Please try again.');
      console.error('Audio generation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold mb-4">Speech Generation</h2>
      <div className="text-sm text-muted-foreground mb-4">
        Generate audio clips from text prompts. Enter a prompt, select a voice, and click Generate.
      </div>
      
      <div className="space-y-2">
        <label className="block text-sm font-medium">Script</label>
        <textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          className="w-full p-2 border rounded min-h-[100px]"
          placeholder="Enter your script here..."
        />
      </div>
      
      <div className="space-y-2">
        <label className="block text-sm font-medium">Voice</label>
        <select
          value={selectedVoice}
          onChange={(e) => setSelectedVoice(e.target.value)}
          className="w-full p-2 border rounded"
          disabled={isLoading}
        >
          {speakers.map((speaker) => (
            <option key={speaker.id} value={speaker.voice}>
              {speaker.name} ({speaker.voice})
            </option>
          ))}
        </select>
      </div>
      
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Pitch: {pitch.toFixed(1)}
        </label>
        <input
          type="range"
          min={-20}
          max={20}
          step={0.1}
          value={pitch}
          onChange={(e) => setPitch(Number(e.target.value))}
          className="w-full"
          disabled={isLoading}
        />
      </div>
      
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Volume: {volume}%
        </label>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-full"
          disabled={isLoading}
        />
      </div>
      
      <div className="pt-2">
        <button
          type="button"
          onClick={handleGenerateAudio}
          disabled={isLoading}
          className={`w-full py-2 px-4 rounded-md ${
            isLoading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white transition-colors`}
        >
          {isLoading ? 'Generating...' : 'Generate Audio'}
        </button>
      </div>
      
      {error && (
        <div className="mt-2 p-2 text-sm text-red-600 bg-red-50 rounded border border-red-100">
          {error}
        </div>
      )}
    </div>
  );
};

export default SpeechGeneration;
