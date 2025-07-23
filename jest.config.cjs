module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx|mjs)$': 'ts-jest',
    '^.+\\.js$': 'babel-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'mjs', 'json', 'node'],
  transformIgnorePatterns: [
    'node_modules/(?!(obs-websocket-js)/)',
  ],
};
