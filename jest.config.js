/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',
  transform: {
    '^.+\\.(ts|tsx|js|jsx|mjs|cjs)$': 'ts-jest',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!gsap)/'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^store/(.*)$': '<rootDir>/src/store/$1',
    '^services/(.*)$': '<rootDir>/src/services/$1',
    '^types/(.*)$': '<rootDir>/src/types/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleFileExtensions: [
    "ts",
    "tsx",
    "js",
    "jsx",
    "json",
    "node"
  ],
};
