<!-- Copilot instructions for contributing code with automated agents -->
# obs-copilot — Copilot instructions (concise)

These concise rules help automated coding agents be productive in this repository. Use exact file references and examples — avoid generic suggestions.

- Stack & big picture: React + TypeScript app built with Vite. Frontend lives in `src/`, a small Python backend lives in `backend/` (FastAPI/uvicorn). Key subsystems:
  - UI: `src/components/` and primitives in `src/components/ui/`
  - Features: `src/features/` (self-contained feature modules)
  - Services: `src/services/` (network/side-effect logic: `geminiService.ts`, `obsClient.ts`, `streamerBotService.ts`, `audioService.ts`, `automationService.ts`)
  - State: Zustand stores in `src/store/` (use existing stores; e.g. `src/store/connectionsStore.ts` for connection state)

- Quick dev workflows (from `package.json`):
  - Frontend dev: `npm run frontend:dev` or `npm run dev` to run frontend + backend concurrently.
  - Backend dev: `npm run backend:dev` (runs backend/venv Uvicorn). Prep with `npm run backend:setup` which uses `scripts/backend-preflight.js` to create `backend/venv` via pipenv.
  - Build: `npm run build`; Preview: `npm run preview`; Tests: `npm run test`; Lint: `npm run lint`.

- Important conventions and examples:
  - Imports use Vite/tsconfig aliases (e.g. `@/`, `components/*`, `services/*`). Check `vite.config.ts`/`tsconfig.json` before adding imports.
  - Centralize long-running connections in `src/services/*`. Example: OBS websocket logic is implemented in `src/services/obsClient.ts` and event constants live in `src/services/obsWebSocketEvents.d.ts` / `src/constants/obsEvents.ts`.
  - UI should call hooks in `src/hooks/` (e.g. `useStreamerBotConnection.ts`, `useGeminiChat.ts`) not raw services directly.
  - Types belong in `src/types/` (avoid inline `any`). When introducing new public data shapes, add them to `src/types/` and update `src/lib/apiUtils.ts` if they interact with LLM mappers.
  - Styling: Tailwind CSS utilities + primitives in `src/components/ui/`. GSAP is used for animations; the MorphSVG plugin is optional (see README for installation and fallback behavior).

- Integration specifics (do not guess APIs):
  - OBS: project targets `obs-websocket-js@^5` (see `package.json`). Use `src/services/obsClient.ts` and `src/store/connectionsStore.ts` for connection lifecycle.
  - Streamer.bot: integration through `src/services/streamerBotService.ts` and hooks (`useStreamerBotActions.ts`, `useStreamerBotConnection.ts`). UI forms reference `src/plugins/core/ConnectionForm.tsx` for host/port handling.
  - Gemini/LLM: central API client is `src/services/geminiService.ts`. Preserve context and use `src/lib/apiUtils.ts` mappers when transforming messages.

- Tests, linting, and guardrails:
  - Tests live under `src/**/__tests__/` and `backend/tests/`. Run `npm test` (Jest + ts-jest). Keep changes small and type-safe to satisfy strict TS rules.
  - Never commit secrets. Use `.env.example` as template and `.env.local` for local values; client-visible env vars must be `VITE_` prefixed.

- Quick examples to copy-paste:
  - Connect to OBS in code: import the client and use the connections store
    - import: `import obsClient from 'services/obsClient'` (use alias)
    - state: `useConnectionsStore.getState().isObsConnected`
  - Add automation action: implement logic in `src/features/automation/` and register mapping in `src/services/automationService.ts`.

If anything is unclear or you want more examples (tests, common refactors, or a short checklist for PRs), tell me which section to expand.
