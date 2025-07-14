module.exports = {
  preset: 'ts-jest',
  // Default to node, but can be overridden
  testEnvironment: 'node',
  projects: [
    {
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: [ // Matches .js files in the top-level __tests__ directory
        '<rootDir>/__tests__/**/*.test.js',
      ],
      // Specific setup for node environment if needed
    },
    {
      displayName: 'jsdom',
      testEnvironment: 'jsdom',
      testMatch: [ // Matches .ts files under src (like src/utils/__tests__)
        '<rootDir>/src/**/__tests__/**/*.test.ts',
        '<rootDir>/src/**/?(*.)+(spec|test).ts',
      ],
      moduleNameMapper: {
        // Handle module aliases (if you have them in tsconfig.json)
        // Example: '^@components/(.*)$': '<rootDir>/src/components/$1'
      },
      preset: 'ts-jest', // ts-jest is needed for TypeScript files
    },
  ],
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',
  // An array of file extensions your modules use
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx', 'node'],
  // A map from regular expressions to module names that allow to stub out resources with a single module
  moduleNameMapper: {
    // Handle module aliases (if you have them in tsconfig.json)
    // Example: '^@components/(.*)$': '<rootDir>/src/components/$1'
  },
  // The test pattern Jest uses to detect test files
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)',
  ],
  // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
  testPathIgnorePatterns: ['/node_modules/', '/dist-node/'],
  testURL: 'http://localhost/',
  // Indicates whether each individual test should be reported during the run
  verbose: true,
  // Setup files after the environment is set up
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // if you need setup files
};
