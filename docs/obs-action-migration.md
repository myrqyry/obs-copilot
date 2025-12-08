# OBS Action Validation / Executor / State Manager Migration Guide

This document summarizes the changes required to integrate enhanced validation, transactional execution, and change-detection for OBS actions.

## Files added
- `src/shared/services/obsActionValidator.ts`
- `src/shared/services/obsActionExecutor.ts`
- `src/shared/services/obsStateManager.ts`

## Overview
- `obsActionValidator` validates single actions and batches for correctness before executing them.
- `obsActionExecutor` executes actions in a sorted, transactional manner with rollback support.
- `obsStateManager` tracks changes between OBS states and provides a small change history for models.

## Migration Steps
1. Phase 1: Add the new files (non-breaking)
   - `obsActionValidator.ts`
   - `obsActionExecutor.ts`
   - `obsStateManager.ts`
   - Run `npm run type-check` to ensure the project compiles.

2. Phase 2: Update enhanced cache invalidation
   - Update `src/shared/services/obsClient.ts` in `setupEventListeners()` to expand the `invalidationMap` to include more OBS events that should invalidate caches.

3. Phase 3: Integrate the action validator (opt-in)
   - Update `src/shared/hooks/useGeminiChat.ts` to import `obsActionValidator` and perform validation using `validateBatch()` before executing any OBS actions. If validation fails, show helpful error messages and do not attempt execution.

4. Phase 4: Integrate the transaction executor (recommended)
   - Replace the current action execution loop in `useGeminiChat.ts` with `obsActionExecutor.executeActionsWithTransaction()`, providing `handleObsAction` as a handler and passing `obsStateManager.getStateWithChanges().full_state` for context.
   - Display progress updates and final success/failure messages to the user.

5. Phase 5: Integrate state change detection (optional)
   - Replace direct `obsClient.getFullState()` calls with `obsStateManager.getStateWithChanges()` and provide the `state_changes` and `recent_changes` in the request body of `aiService.queryWithOBSContext()`.
   - Update backend to accept these new fields in `OBSAwareRequest`.

6. Phase 6: Reset state on disconnect
   - In `obsClient.disconnect()`, call `obsStateManager.reset()` to clear cached state change tracking.
   - Use a dynamic import to avoid circular imports: `const module = await import('./obsStateManager'); module.obsStateManager.reset();`

## Quick verification checklist
- The new service files compile without errors when imported and used.
- The `obsClient` cache invalidation now triggers on additional OBS events.
- Invalid actions show helpful, user-facing error messages instead of executing.
- If an action fails mid-sequence, prior changes are rolled back, and the user is notified.
- `obsStateManager.getStateWithChanges()` returns deltas and `is_first_query` set appropriately.
- `obsStateManager.reset()` is called on disconnect and clears state tracking.

## Testing Scenarios
- Validation error: "Switch to scene 'DoesNotExist'" should show validation error and suggestions.
- Transaction rollback: Sequence where a create operation succeeds but a subsequent action fails should roll back the created resource.
- Change detection: Manually switch scene and verify `obsStateManager` logs the change in `getStateWithChanges()`.
- Progress updates: Creating multiple sources shows progress updates in chat messages.

## Rollback
If the feature causes issues, remove any imports of the new modules and re-run tests or revert to previous commit. The new files will not run unless they are imported and used.

## Post-Migration Enhancements

### Dynamic OBS Action Handling

The `useObsActions` hook has been refactored to dynamically handle any OBS action type. Previously, it only supported a few hardcoded actions. Now, it uses a generic fallback handler that maps camelCase action types from the AI to PascalCase request types for the OBS WebSocket API.

This change provides the following benefits:

*   **Complete API Coverage:** Any action defined in the `ObsAction` type that follows the standard OBS naming convention will work without explicit handling.
*   **Future-Proofing:** New OBS actions can be supported by simply adding them to the type definitions.
*   **Simplified Maintenance:** No need to add a new `case` for every new action.

The implementation details can be found in `src/shared/hooks/useObsActions.ts`.