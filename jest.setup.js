import '@testing-library/jest-dom';
import { vi, beforeEach, afterEach } from 'vitest';
import { act } from '@testing-library/react';

// This is the recommended way to mock Zustand in Vitest/ESM
// See: https://docs.pmnd.rs/zustand/guides/testing-with-vitest
const { create: actualCreate } = await vi.importActual('zustand');

// a variable to hold reset functions for all stores
const storeResetFns = new Set();

// when creating a store, we get its initial state, create a reset function and add it to the set
vi.mock('zustand', () => ({
  __esModule: true,
  ...actualCreate,
  default: (...args) => {
    const store = actualCreate(...args);
    const initialState = store.getState();
    storeResetFns.add(() => store.setState(initialState, true));
    return store;
  },
  create: (...args) => {
    const store = actualCreate(...args);
    const initialState = store.getState();
    storeResetFns.add(() => store.setState(initialState, true));
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
const ResizeObserverMock = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

vi.stubGlobal('ResizeObserver', ResizeObserverMock);

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