import { describe, it, expect, vi, beforeEach } from 'vitest';
// Mock obs-websocket-js to avoid constructor errors during tests
vi.mock('obs-websocket-js', () => {
  return {
    default: class {
      on = vi.fn();
      off = vi.fn();
      call = (method: string, params?: any) => {
        switch (method) {
          case 'GetCurrentProgramScene':
            return Promise.resolve({ currentProgramSceneName: 'Main' });
          case 'GetSceneList':
            return Promise.resolve({ scenes: [{ sceneName: 'Main' }, { sceneName: 'Gaming' }] });
          case 'GetInputList':
            return Promise.resolve({ inputs: [{ inputName: 'Mic', inputKind: 'wasapi_input_capture', inputVolumeDb: 0, inputMuted: false }] });
          case 'GetStreamStatus':
            return Promise.resolve({ outputActive: false });
          case 'GetRecordStatus':
            return Promise.resolve({ outputActive: false });
          default:
            return Promise.resolve({});
        }
      };
    }
  };
});
import { obsStateManager } from '@/shared/services/obsStateManager';
import { obsClient } from '@/shared/services/obsClient';

beforeEach(() => {
  vi.restoreAllMocks();
  obsStateManager.reset();
});

describe('ObsStateManager', () => {
  it('returns first query with is_first_query true and no changes', async () => {
    vi.spyOn(obsClient, 'getFullState').mockResolvedValue({ current_scene: 'Main', available_scenes: ['Main'] });

    const state = await obsStateManager.getStateWithChanges();
    expect(state.is_first_query).toBe(true);
    expect(state.changes).toBeNull();
    expect(Array.isArray(state.recent_changes)).toBe(true);
  });

  it('detects scene changes and records them', async () => {
    // First state
    vi.spyOn(obsClient, 'getFullState').mockResolvedValueOnce({ current_scene: 'Main', available_scenes: ['Main'] });
    const first = await obsStateManager.getStateWithChanges();
    expect(first.is_first_query).toBe(true);

    // Second state with scene changed
    vi.spyOn(obsClient, 'getFullState').mockResolvedValueOnce({ current_scene: 'Gaming', available_scenes: ['Main', 'Gaming'] });
    const second = await obsStateManager.getStateWithChanges();

    expect(second.is_first_query).toBe(false);
    expect(second.changes).toBeTruthy();
    expect((second.changes as any).scene_changed).toBeTruthy();
    expect(second.recent_changes.length).toBeGreaterThanOrEqual(1);
  });

  it('coalesces concurrent getStateWithChanges calls (via obsClient.getFullState)', async () => {
    let callCount = 0;
    // Slow down one of the cached getter methods so that getFullState() is pending
    // Ensure obsClient reports connected, so getFullState will build state instead of returning empty
    (obsClient as any)['status'] = 'connected';
    vi.spyOn(obsClient, 'getCurrentProgramSceneCached').mockImplementation(async () => {
      callCount++;
      await new Promise((res) => setTimeout(res, 50));
      return { currentProgramSceneName: 'Main' } as any;
    });

    const p1 = obsStateManager.getStateWithChanges();
    const p2 = obsStateManager.getStateWithChanges();

    const [r1, r2] = await Promise.all([p1, p2]);
    expect(callCount).toBe(1);
    expect(r1.full_state.current_scene).toBe('Main');
    expect(r2.full_state.current_scene).toBe('Main');
  });
});
