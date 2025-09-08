// Mock global console before any tests run
jest.doMock('console', () => ({
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

let logger: typeof import('../logger').logger;
let consoleDebug: any;
let consoleInfo: any;
let consoleWarn: any;
let consoleError: any;

describe('Logger', () => {
  beforeEach(() => {
    jest.resetModules(); // Reset module registry so require('../logger') yields a fresh module

    // Get the mocked console methods
    const mockConsole = require('console');
    consoleDebug = mockConsole.debug;
    consoleInfo = mockConsole.info;
    consoleWarn = mockConsole.warn;
    consoleError = mockConsole.error;

    // Import the logger after mocking console
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('../logger');
    logger = mod.logger;
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear mock calls between tests
  });

  it('should log debug messages', () => {
    logger.debug('Debug message', { key: 'value' });
    expect(consoleDebug).toHaveBeenCalledWith(
      expect.stringContaining('[DEBUG]'),
      'Debug message',
      { key: 'value' },
    );
  });

  it('should log info messages', () => {
    logger.info('Info message', 123);
    expect(consoleInfo).toHaveBeenCalledWith(
      expect.stringContaining('[INFO]'),
      'Info message',
      123,
    );
  });

  it('should log warn messages', () => {
    logger.warn('Warning message');
    expect(consoleWarn).toHaveBeenCalledWith(
      expect.stringContaining('[WARN]'),
      'Warning message',
    );
  });

  it('should log error messages and capture error details', () => {
    const testError = new Error('Something went wrong');
    logger.error('Error occurred', testError);
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('[ERROR]'),
      'Error occurred',
      testError,
    );
    expect(consoleError).toHaveBeenCalledWith(
      'Error details:',
      testError.message,
      testError.stack,
    );
  });

  it('should log error messages without error details if not an Error object', () => {
    logger.error('Another error', 'just a string');
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('[ERROR]'),
      'Another error',
      'just a string',
    );
    expect(consoleError).not.toHaveBeenCalledWith(
      'Error details:',
      expect.any(String),
      expect.any(String),
    );
  });
});