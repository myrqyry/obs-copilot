module.exports = {
  // Removed runInBand as it's an unknown option and causes a warning
  projects: [
    {
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/__tests__/**/*.test.cjs'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          isolatedModules: true,
        }],
        '^.+\\.m?js$': 'babel-jest',
      },
      transformIgnorePatterns: ['/node_modules/(?!node-fetch|data-uri-to-buffer|fetch-blob|formdata-polyfill)'],
      moduleNameMapper: {
        'node-fetch': '<rootDir>/__tests__/mocks/node-fetch.js', // Mock node-fetch for node environment
      },
    },
    {
      displayName: 'jsdom',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/__tests__/**/*.test.ts', '<rootDir>/__tests__/**/*.test.tsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
          isolatedModules: true,
        }],
        '^.+\\.m?js$': 'babel-jest', // Ensure .mjs files are transformed
      },
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      setupFiles: ['<rootDir>/jest.setup.env.js'], // Use this for mocking import.meta.env
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^obs-websocket-js$': '<rootDir>/src/services/__mocks__/obs-websocket-js.ts', // Explicitly mock OBSWebSocket
        'node-fetch': '<rootDir>/__tests__/mocks/node-fetch.js', // Mock node-fetch
        '^src/constants$': '<rootDir>/__tests__/mocks/constants.js', // Mock src/constants.ts
        '\\?raw$': '<rootDir>/__tests__/mocks/rawFile.js', // Mock raw file imports
        'tm-themes': '<rootDir>/__tests__/mocks/tm-themes.js',
      },
      // Removed globals as it's handled by jest.setup.env.js
    },
  ],
};
