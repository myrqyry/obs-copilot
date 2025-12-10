## Step 1: Harden OBS Client Connection
Refactor `src/shared/services/obsClient.ts` to implement robust "singleton" connection management.
- Prevent race conditions during `connect()`.
- Improve the `reconnect` logic with strict state guards.
- Implement a heartbeat check.

## Step 2: Automation Service Transaction Testing
Create comprehensive tests for `src/shared/services/obsActionExecutor.ts`.
- Mock OBS responses.
- Test successful sequence execution.
- Test failure at step 2 of 3, verifying "Rollback" actions are called.

## Step 3: Optimize Gemini Chat Hook
Refactor `src/shared/hooks/useGeminiChat.ts`.
- Decouple UI state updates from async logic using `useReducer`.
- Ensure tool calls (OBS actions) don't block the UI thread.
- Improve error feedback when the Backend is offline.

## Step 4: Backend Router Validation
Verify and update `backend/main.py` (assumed existence) to ensure all frontend `api/generated/*` routes have corresponding endpoints.
- Create missing routes if necessary based on `src/api/generated`.