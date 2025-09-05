<!-- Copilot instructions for contributing code with automated agents -->
# obs-copilot — Copilot instructions

These short rules help AI coding agents be productive in this repository. Keep the guidance concise and actionable; reference real files and patterns rather than generic advice.

1. Big picture
   - This is a React + TypeScript Vite app (see `package.json`, `vite.config.ts`, `tsconfig.json`).
   - Project layout (top-level): `src/`, `backend/`, `public/`, `scripts/`, `postcss.config.js`, `tailwind.config.cjs`, `package.json`, `README.md`.
   - Frontend lives under `src/`. Important subfolders:
     - `src/components/ui/` — reusable, presentational UI primitives (Button, Card, Input). Keep these framework-agnostic and small.
     - `src/components/` — shared components that may compose primitives into small widgets (e.g., `MusicMiniController`).
     - `src/features/` — self-contained feature modules (UI + local logic) that represent complete app features (e.g., `features/asset-search`, `features/automation`, `features/chat`). Prefer placing feature-specific pages and heavy logic here (e.g., `GeminiChat`, `ObsConnectionTab`).
     - `src/services/` — side-effect and network logic (OBS, Gemini, Streamer.bot, audio). Keep API clients and long-running connection logic here.
     - `src/hooks/` — small reusable React hooks that compose `services` and `store` for UI needs.
     - `src/store/` — global Zustand stores; use them for shared application state.
   - Key services: `src/services/geminiService.ts` (LLM), `src/services/obsClient.ts` and `src/services/obsWebSocketEvents.d.ts` (OBS WebSocket v5 integration), `src/services/streamerBotService.ts` (Streamer.bot). Use these when wiring automation or network code.

2. Developer workflows & commands
   - Start the frontend dev server: `npm run frontend:dev` (or `npm run dev` to run frontend + backend concurrently). See `package.json` scripts.
   - Build for production: `npm run build`; preview: `npm run preview`.
   - Backend dev helper: `npm run backend:dev` (runs `node scripts/backend-dev.js`). If you need the Python backend in `backend/`, use `./scripts/setup_backend.sh` and run with the usual Python tooling (see `backend/README` if present).
   - Environment variables: client-side keys must use the Vite prefix `VITE_` (see `.env.example` referenced in `README.md`). Agents must not hardcode secrets; instead, reference `.env.example` and use `VITE_`-prefixed keys for client usage.

3. Conventions & patterns to follow
   - Aliases: imports use Vite path aliases — e.g. `@/`, `components/*`, `services/*` (see `vite.config.ts` and `tsconfig.json` paths). Prefer these aliases when adding new imports.
   - State: global state is managed via Zustand in `src/store/`. Use existing stores instead of creating ad-hoc contexts.
   - Services: centralize network/side-effect logic in `src/services/` (e.g., `obsClient.ts`, `audioService.ts`, `geminiService.ts`). UI components should call services/hooks (see `src/hooks/*`) rather than directly performing network ops.
   - Types: add or update TypeScript types in `src/types/` not inline `any`. Common shared types live in `src/types/index.ts` and `src/types/*` files.
   - Styling: Tailwind CSS is used across the project (`index.css`, `tailwind.config.cjs`). New UI should use Tailwind utility classes and existing UI primitives in `src/components/ui/`.
   - Animations: GSAP is used; the morphing plugin is optional and handled by a runtime warning (see README). Don’t assume proprietary plugins are available.
   - Handling legacy/first-working code: when refactoring or replacing old components (the "first working version"), prefer rewriting using the new conventions (primitives in `src/components/ui/` and feature modules under `src/features/`) rather than incrementally patching legacy code. Create a small migration test or story to validate the replacement.

4. Integration & communication patterns
   - OBS: code expects obs-websocket-js v5 (see `package.json`). Use `src/services/obsClient.ts` and `src/constants/obsEvents.ts` for event names and mapping.
   - Streamer.bot: WebSocket integration is encapsulated in `src/services/streamerBotService.ts` and related hooks (`useStreamerBotConnection.ts` / `useStreamerBotActions.ts`).
   - Gemini/AI: LLM interactions are done through `src/services/geminiService.ts` and hooks like `useGeminiChat.ts` / `useGeminiLive.ts`. Preserve context and use the existing mapper utilities in `src/lib/apiUtils.ts` where applicable.

5. Tests & linting
   - Tests live under `src/**/__tests__/` and top-level `tests/`. Running `npm test` should run the test harness configured in the repo (see `jest.config.js`).
   - ESLint and TypeScript strict rules are enforced; prefer small, type-safe changes and update types when needed.

6. Helpful code pointers (examples)
   - Add OBS-related handlers in `src/services/obsClient.ts` and map events in `src/constants/obsEvents.ts`. For connection state and cross-component access, the connection store is `src/store/connectionsStore.ts` — prefer reading/writing connection status there for UI sync.
   - Add new automation rules in `src/features/automation/` and wire them to `src/services/automationService.ts`.
   - For asset search providers, update `src/config/assetSearchConfigs.ts` and `src/config/enhancedApiMappers.ts` (see `src/features/asset-search/README.md`).
   - Debugger tip — React hooks error: If you encounter "Rendered fewer hooks than expected" or "Rendered more hooks than during the previous render", the root cause is almost always a hook being called conditionally. Ensure all React hooks (`useState`, `useEffect`, custom hooks) are invoked unconditionally at the top level of a component. Search recent changes for `if (...) return` wrappers around hook calls.

7. Safety & secrets
   - Never insert real API keys or secrets into code. Reference `.env.example` and use `VITE_` variables for client needs. For server-side secrets, prefer the `backend/` Python service and its `requirements.txt`/`pyproject.toml`.

8. If you’re unsure
   - Look for examples under `src/components/`, `src/services/`, and `src/hooks/` before creating new patterns. The README (`README.md`) and `src/features/asset-search/README.md` contain canonical examples.

If anything here is unclear or you need more detail about a directory, tell me which area to expand and I’ll iterate. 
