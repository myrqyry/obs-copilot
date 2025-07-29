import { TextToSpeechClient } from '@google-cloud/text-to-speech';

export class AudioService {
    private client: TextToSpeechClient;

    constructor() {
        this.client = new TextToSpeechClient();
    }

    async generateAudio(text: string): Promise<string> {
        try {
            const [response] = await this.client.synthesizeSpeech({
                input: { text },
                voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' },
                audioConfig: { audioEncoding: 'MP3' },
            });

            // Defensive: check for audioContent and convert to base64 if present
            if (!response.audioContent) {
                console.error('No audio content returned from TTS API for text:', text);
                throw new Error('No audio content returned from TTS API');
            }
            
            // audioContent is a Buffer or Uint8Array. Convert to base64 for browser compatibility (OBS dock expects a playable data URL)
            const audioContentBase64 = Buffer.isBuffer(response.audioContent)
                ? response.audioContent.toString('base64')
                : Buffer.from(response.audioContent as Uint8Array).toString('base64');
    
            // Return as a data URL (MP3, base64-encoded) for maximum compatibility with browsers and OBS docks
            return `data:audio/mp3;base64,${audioContentBase64}`;
        } catch (error) {
            console.error('Error generating audio from TTS API:', error);
            // Re-throw the error to be handled by the calling function
            throw new Error(`Failed to generate audio: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
