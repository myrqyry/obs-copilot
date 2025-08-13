---
title: "Gemini API Integration"
tags: ["api", "gemini", "ai", "chat"]
last_updated: "2025-08-11"
owner: "@myrqyry"
---

# Gemini API Specification

## Authentication
- Uses API key authentication
- Never expose the key in client-side code. Store it server-side (e.g., `GEMINI_API_KEY`) and proxy requests through your backend.
- Pass the key as a query parameter: `?key=${API_KEY}`. Do not use `Authorization: Bearer` with API keys.
- If you must call from the browser (not recommended), strictly restrict the key to allowed HTTP referrers and rate-limit server-side to mitigate abuse.
## Base URL
`https://generativelanguage.googleapis.com/v1beta`

## Endpoints

### Generate Content
`POST /models/${MODEL}:generateContent` (e.g., `gemini-1.5-pro`, `gemini-1.5-flash`)

### Stream Generate Content
`POST /models/${MODEL}:streamGenerateContent`

**Request Body:**
```json
{
  "contents": [
    {
      "role": "user",
      "parts": [
        {"text": "Your prompt here"}
      ]
    }
  ],
  "generationConfig": {
    "temperature": 0.9,
    "topK": 1,
    "topP": 1,
    "maxOutputTokens": 2048,
    "stopSequences": []
  },
  "safetySettings": [
    {
      "category": "HARM_CATEGORY_HARASSMENT",
      "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    }
  ]
}
```

**Response:**
```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {"text": "Model response here"}
        ]
      }
    }
  ]
}
```

## Usage in OBS Copilot

### Integration Points
1. Chat functionality (`GeminiChat.tsx`)
### Implementation Notes
- Streaming responses handled via `:streamGenerateContent` with chunked HTTP responses  
  In browsers, parse the returned `ReadableStream` from `fetch` incrementally (no SSE/EventSource required)
- Error handling for:
  - Rate limiting (429 responses)
  - Authentication failures (401 responses)
  - Content safety violations
### Rate Limits
- Values vary by plan and may change—see the official quotas page for current limits:
  https://platform.openai.com/docs/guides/rate-limits
- Clients should implement throttling and exponential backoff with jitter on 429 responses.
### Rate Limits
- 60 requests per minute (free tier)
- 600 requests per minute (paid tier)

## Code Reference

```typescript:src/features/chat/GeminiChat.tsx
// Example API usage
const response = await fetch(
  '/api/gemini/generate',
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: chatHistory,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
      },
    }),
  }
);
```

## Best Practices
1. Always validate user input before sending to API
2. Implement exponential backoff for rate limiting
3. Cache frequent queries to reduce API calls
4. Use EMP context injection for better responses
