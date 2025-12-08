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
            return Promise.resolve({ scenes: [{ sceneName: 'Main' }] });
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
import { obsActionExecutor } from '@/shared/services/obsActionExecutor';
import { obsClient } from '@/shared/services/obsClient';
import type { ObsAction } from '@/shared/types/obsActions';

// Ensure we can spy on obsClient.call
beforeEach(() => {
  vi.restoreAllMocks();
});

describe('ObsActionExecutor', () => {
  it('rolls back create input on subsequent failure', async () => {
    const calls: Array<{ method: string; params?: any }> = [];

    // spy on obsClient.call to track rollback triggers
    vi.spyOn(obsClient, 'call').mockImplementation(async (method: string, params?: any) => {
      calls.push({ method, params });
      // simulate RemoveInput call success
      return {} as any;
    });

    // define actions: create input then fail on start stream
    const actions: ObsAction[] = [
      { type: 'createInput', inputName: 'tempMic', inputKind: 'wasapi_input_capture' } as any,
      { type: 'startStream' } as any
    ];

    // handleObsAction: succeed for createInput, fail for startStream
    const handler = async (action: any) => {
      if (action.type === 'createInput') return { success: true, data: {} };
      if (action.type === 'startStream') return { success: false, error: 'failed to start' };
      return { success: true, data: {} };
    };

    const result = await obsActionExecutor.executeActionsWithTransaction(actions, handler, { current_scene: 'Main' });

    expect(result.success).toBe(false);
    // We expect rollback to be called for created input (RemoveInput)
    const removeCall = calls.find(c => c.method === 'RemoveInput' || c.method === 'RemoveInput');
    expect(removeCall).toBeTruthy();
  });

  it('executes actions in expected priority order', async () => {
    const order: string[] = [];

    const handler = async (action: any) => {
      order.push(action.type);
      return { success: true, data: {} };
    };

    const actions: ObsAction[] = [
      { type: 'setCurrentProgramScene', sceneName: 'Main' } as any,
      { type: 'setSceneItemEnabled', sceneName: 'Main', sourceName: 'Mic', sceneItemName: 'Mic', sceneItemEnabled: true } as any
    ];

    // Execute
    const sorted = (obsActionExecutor as any).sortActionsByDependency(actions);
    expect(sorted[0].type).toBe('setSceneItemEnabled');
    console.log('sorted types:', sorted.map((s: any) => s.type));

    const result = await obsActionExecutor.executeActionsWithTransaction(actions, handler, { current_scene: 'Other', available_scenes: ['Main', 'Other'], active_sources: [{ inputName: 'Mic', inputKind: 'wasapi_input_capture', inputVolumeDb: 0, inputMuted: false }] } as any);
    expect(result.success).toBe(true);
    // The actual execution order should match the sorted order
    console.log('execution order:', order);
    expect(order).toEqual(sorted.map((s: any) => s.type));
    // setSceneItemEnabled should be executed before setCurrentProgramScene (priority 5 < 6)
    expect(order[0]).toBe('setSceneItemEnabled');
    expect(order[1]).toBe('setCurrentProgramScene');
  });
});
