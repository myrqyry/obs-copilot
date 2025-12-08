import { describe, it, expect } from 'vitest';
import { obsActionValidator } from '@/shared/services/obsActionValidator';

describe('ObsActionValidator', () => {
  it('should reject non-existent scene', async () => {
    const result = await obsActionValidator.validate(
      { type: 'SetCurrentProgramScene', sceneName: 'Invalid' },
      { available_scenes: ['Main', 'Game'], current_scene: 'Main' }
    );

    expect(result.valid).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('should suggest closest match for typo', async () => {
    const result = await obsActionValidator.validate(
      { type: 'SetCurrentProgramScene', sceneName: 'Mainn' },
      { available_scenes: ['Main', 'Game'], current_scene: 'Main' }
    );

    expect(result.valid).toBe(false);
    expect(result.suggestion).toBeTruthy();
    expect(String(result.suggestion)).toContain('Did you mean');
  });
});
