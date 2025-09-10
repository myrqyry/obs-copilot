import '@testing-library/jest-dom';

jest.mock('zustand');

/**
 * Stub UniversalWidgetEngine before any code imports it so the real engine
 * never initializes during tests (prevents console noise and memory use).
 */
jest.mock('@/features/obs-control/UniversalWidgetEngine', () => {
  const EventEmitter = require('eventemitter3');
  class MockEngine extends EventEmitter {
    initialize() {}
    async registerWidget() { return null; }
    async unregisterWidget() {}
    async destroy() {}
    getInstance() { return this; }
  }
  const engine = new MockEngine();
  return {
    __esModule: true,
    default: engine,
    UniversalWidgetEngine: MockEngine,
    widgetEngine: engine,
  };
});

// Require the mocked engine (ensures we reference the stub above)
const { widgetEngine } = require('@/features/obs-control/UniversalWidgetEngine');


Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock gsap to prevent it from running in tests
jest.mock('gsap', () => ({
  gsap: {
    registerPlugin: jest.fn(),
    timeline: jest.fn(() => ({
      to: jest.fn(),
      from: jest.fn(),
      set: jest.fn(),
    })),
    set: jest.fn(),
    to: jest.fn(),
    from: jest.fn(),
    add: jest.fn(),
    clear: jest.fn(),
    kill: jest.fn(),
  },
}));

// Mock ScrollTrigger to prevent registration issues
jest.mock('gsap/ScrollTrigger', () => ({
  create: jest.fn(),
  refresh: jest.fn(),
  kill: jest.fn(),
  getAll: jest.fn(() => []),
  getById: jest.fn(),
  isInViewport: jest.fn(),
}));

// Cleanup UniversalWidgetEngine after each test to prevent memory leaks
afterEach(async () => {
  if (widgetEngine && typeof widgetEngine.destroy === 'function') {
    // ensure silent cleanup (some mocks return sync destroy)
    await widgetEngine.destroy();
  }
});
