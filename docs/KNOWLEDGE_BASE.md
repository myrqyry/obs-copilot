# Knowledge Base API

This service provides a simple markdown-backed knowledge base for AI-generated content. The memory storage is the `memory_bank` directory at the repository root.

Endpoints:
- `POST /api/knowledge` — Create a new knowledge entry (requires `X-API-KEY`). Body: `title`, `content`, optional `tags`.
- `GET /api/knowledge/search?query={query}&limit={n}` — Search the knowledge base for relevant snippets. Returns `source`, `title`, `content`, `relevance`.
- `GET /api/knowledge/{filename}` — Get full content for the given file.

Usage from the AI:
- The Gemini function-calling integration exposes a `save_to_kb(title, content, tags)` tool so the model can choose to persist knowledge for future reference. This uses the backend helper and does not require an API key.

Storage Format:
- Files are stored as Markdown with YAML-style frontmatter containing `title` and `tags`.
