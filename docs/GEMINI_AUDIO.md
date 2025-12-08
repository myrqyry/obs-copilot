## Gemini Audio Integration Guide

This document shows how to use the `geminiService.generateContent` method to submit audio (inline or previously-uploaded) alongside a text prompt for transcription, description, or timestamped analysis.

Frontend (TypeScript) example:

```ts
import { geminiService } from '@/shared/services/geminiService';

// Inline small audio (base64) - keep this under 20 MB total payload.
const audioInline = {
  data: 'base64-encoded-audio-data',
  mimeType: 'audio/mp3',
};

const response = await geminiService.generateContent('Summarize this audio', {
  model: 'gemini-2.5-flash',
  audioInline,
});

// If you uploaded audio via a Files API, pass the resulting file URI
const fileUri = 'https://files.example.com/uploaded-file-id';
const response2 = await geminiService.generateContent('Transcribe this file', {
  model: 'gemini-2.5-flash',
  audioFileUri: fileUri,
});
```

Notes:
- Use `audioInline` for small files under 20MB total payload.
- Use `audioFileUri` for files uploaded with a Files API (server uploads) or remote URLs.
- The backend expects inline audio as `audioInline` in the POST payload to `/gemini/generate-content`.
- If you need streaming behaviour, prefer `generateStreamingContent` and the streaming endpoints in the backend.

Backend behaviour:
- If the request includes `audioInline`, the backend should validate the base64 string and pass a `Part(inline_data=types.Blob(...))` to the SDK.
- If the request includes `audioFileUri`, backend can either proxy this URI as `Part.from_uri` or first `Files.Upload` it on behalf of the user if required by the SDK.

Security & limits:
- For inline audio, validate MIME types and sizes on the backend.
- For uploaded files, prefer server-side scanning and file validation.

This guide describes how to integrate audio into the existing Gemini client wrapper methods in the app and follows the established endpoints in the backend for authenticated, proxied usage of the Gemini API.
