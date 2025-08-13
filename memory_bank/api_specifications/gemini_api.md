---
title: "Gemini API Integration"
tags: ["api", "gemini", "ai", "chat"]
last_updated: "2025-08-11"
owner: "@myrqyry"
---

# Gemini API Specification

## Authentication
- Uses API key authentication
- Key stored in environment variable `VITE_GEMINI_API_KEY`
- Passed in Authorization header: `Authorization: Bearer ${key}`

## Base URL
`https://generativelanguage.googleapis.com/v1beta`

## Endpoints

### Generate Content
`POST /models/gemini-pro:generateContent`

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
2. Context-aware suggestions
3. Automated OBS control actions

### Implementation Notes
- Streaming responses handled via Server-Sent Events (SSE)
- Error handling for:
  - Rate limiting (429 responses)
  - Authentication failures (401 responses)
  - Content safety violations

### Rate Limits
- 60 requests per minute (free tier)
- 600 requests per minute (paid tier)

## Code Reference

```typescript:src/features/chat/GeminiChat.tsx
// Example API usage
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
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
