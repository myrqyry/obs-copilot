// reproduction test for console spy behavior
/* eslint-disable @typescript-eslint/no-var-requires */

jest.mock('console', () => ({
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('console spy reproduction', () => {
  let consoleDebug: jest.Mock;
  let consoleInfo: jest.Mock;
  let consoleWarn: jest.Mock;
  let consoleError: jest.Mock;

  beforeEach(() => {
    jest.resetModules();

    // Get the mocked console methods
    const mockConsole = require('console');
    consoleDebug = mockConsole.debug;
    consoleInfo = mockConsole.info;
    consoleWarn = mockConsole.warn;
    consoleError = mockConsole.error;

    console.log('=== BEFORE LOGGER IMPORT ===');
    console.log('Mocked console.debug:', consoleDebug);
    console.log('Mock calls before logger import:', consoleDebug.mock.calls.length);

    // Test direct console call to verify mocking works
    console.debug('DIRECT CONSOLE DEBUG TEST');
    console.error('DIRECT CONSOLE ERROR TEST');
    console.log('DIRECT CONSOLE LOG TEST');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('logger calls mocked console methods', () => {
    console.log('=== IMPORTING LOGGER ===');
    
    // Import the logger after mocking console
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('../logger');
    const logger: typeof mod.logger = mod.logger;

    console.log('Logger imported, calling methods...');
    logger.debug('debug message');
    logger.info('info message');
    logger.warn('warn message');
    logger.error('error message', new Error('test-error'));

    console.log('Logger methods called, checking mocks...');
    console.log('Debug mock calls after logger:', consoleDebug.mock.calls.length);
    console.log('Error mock calls after logger:', consoleError.mock.calls.length);

    // Test direct console calls again to compare
    console.debug('POST-LOGGER DIRECT DEBUG');
    console.error('POST-LOGGER DIRECT ERROR');

    expect(consoleDebug).toHaveBeenCalled();
    expect(consoleInfo).toHaveBeenCalled();
    expect(consoleWarn).toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalled();
  });
});