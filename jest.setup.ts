import '@testing-library/jest-dom';

import { widgetEngine } from '@/features/obs-control/UniversalWidgetEngine';

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
  await widgetEngine.destroy();
});

// Cleanup UniversalWidgetEngine after each test to prevent memory leaks
afterEach(async () => {
  await widgetEngine.destroy();
});