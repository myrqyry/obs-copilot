// src/plugins/core/__tests__/PluginManager.test.ts
import { PluginManager } from '../PluginManager';
import React from 'react';

// Mock dependencies
const mockObs = {
  connect: vi.fn(),
  disconnect: vi.fn(),
};
const mockGemini = {
  generateContent: vi.fn(),
};

describe('PluginManager', () => {
  it('registers plugins successfully', async () => {
    const manager = new PluginManager({ obs: mockObs, gemini: mockGemini });

    const plugin = {
      id: 'test-plugin',
      name: 'Test',
      version: '1.0.0',
      component: () => React.createElement('div', null, 'Test'),
    };

    await manager.register(plugin);

    expect(manager.getPlugin('test-plugin')).toBeDefined();
  });

  it('handles plugin lifecycle correctly', async () => {
    const onInit = vi.fn();
    const onActivate = vi.fn();
    const onDeactivate = vi.fn();

    const plugin = {
      id: 'test-plugin',
      name: 'Test',
      version: '1.0.0',
      component: () => React.createElement('div', null, 'Test'),
      onInit,
      onActivate,
      onDeactivate,
    };

    const manager = new PluginManager({ obs: mockObs, gemini: mockGemini });
    await manager.register(plugin);
    await manager.activate('test-plugin');

    expect(onInit).toHaveBeenCalled();
    expect(onActivate).toHaveBeenCalled();

    await manager.deactivate('test-plugin');
    expect(onDeactivate).toHaveBeenCalled();
  });
});
