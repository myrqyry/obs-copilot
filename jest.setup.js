import 'react';
import '@testing-library/jest-dom';
import { vi, beforeEach, afterEach } from 'vitest';
import { act } from '@testing-library/react';

const { create: actualCreate } = await vi.importActual('zustand');

const storeResetFns = new Set();

vi.mock('zustand', () => ({
  __esModule: true,
  create: (...args) => {
    const store = actualCreate(...args);
    if (typeof store.getState === 'function') {
      const initialState = store.getState();
      storeResetFns.add(() => store.setState(initialState, true));
    }
    return store;
  },
  // Mock the default export if it's used for creating stores as well
  default: (...args) => {
    const store = actualCreate(...args);
    if (typeof store.getState === 'function') {
      const initialState = store.getState();
      storeResetFns.add(() => store.setState(initialState, true));
    }
    return store;
  },
}));

// Reset all stores before each test
beforeEach(() => {
  act(() => {
    storeResetFns.forEach((resetFn) => resetFn());
  });
});

// Clear mocks after each test to ensure a clean slate
afterEach(() => {
  vi.clearAllMocks();
});

// Polyfill for ResizeObserver, which is not available in JSDOM
class ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
vi.stubGlobal('ResizeObserver', ResizeObserver);

// Polyfill for matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

vi.mock('import.meta.env', () => ({
  VITE_GEMINI_API_KEY: 'test-api-key',
}));

vi.mock('obs-websocket-js', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      call: vi.fn().mockResolvedValue({}),
      on: vi.fn(),
      off: vi.fn(),
    })),
  };
});

vi.mock('buffer', () => {
  const bufferMock = {
    Buffer: {
      from: vi.fn((str) => ({
        toString: vi.fn(() => str),
      })),
    },
  };
  return { ...bufferMock, default: bufferMock };
});
