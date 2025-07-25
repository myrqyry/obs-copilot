module.exports = {
  runInBand: true,
  projects: [
    {
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/__tests__/**/*.test.cjs'],
      transform: {
        '^.+\\.m?js$': 'babel-jest',
      },
    },
    {
      displayName: 'jsdom',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/src/**/*.test.ts'],
      transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
      },
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    },
  ],
};
