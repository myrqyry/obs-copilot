# OBS Copilot Stabilization Specification

## 1. Resilience & State Management
- **OBS Client**: Hardening connection logic. Current implementation risks reconnect storms. Needs strict exponential backoff and connection locking.
- **Automation Service**: The transaction executor needs unit tests to ensure it rolls back OBS changes correctly on failure.
- **Type Safety**: Eliminate temporary `any` casts in `src/shared/types/obsActions.ts`.

## 2. Performance
- **React Render Cycles**: Optimize `MessageList` and `UniversalWidgetEngine`.
- **Memory**: Ensure `useGsapCleanup` is utilized in all animated components to prevent leaks.

## 3. Completeness
- **Media Generation**: Implement the `VideoGeneration` placeholders with actual backend polling logic.
- **Missing APIs**: Ensure `backend/main.py` actually mounts the routers referenced in frontend (`proxy_emotes`, etc.).

## 4. Testing Strategy
- **Unit**: Vitest for Services (ActionMapper, ValueConverter).
- **Integration**: Mock WebSocket server for OBS client testing.