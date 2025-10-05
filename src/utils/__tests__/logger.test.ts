import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';

let logger: typeof import('../logger').logger;
let consoleDebug: vi.SpyInstance;
let consoleInfo: vi.SpyInstance;
let consoleWarn: vi.SpyInstance;
let consoleError: vi.SpyInstance;

describe('Logger', () => {
  beforeEach(async () => {
    // Spy on console methods and provide a mock implementation to avoid logging to the console during tests.
    consoleDebug = vi.spyOn(console, 'debug').mockImplementation(() => {});
    consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Reset modules to ensure we get a fresh instance of the logger
    vi.resetModules();
    const mod = await import('../logger');
    logger = mod.logger;
  });

  afterEach(() => {
    // Restore original console methods
    vi.restoreAllMocks();
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
    // The logger also logs error details separately
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