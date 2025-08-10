import { logger } from '../logger';

describe('Logger', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    // Spy on all console methods to prevent actual console output during tests
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'debug').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks(); // Restore original console methods
  });

  it('should log debug messages', () => {
    logger.debug('Debug message', { key: 'value' });
    expect(console.debug).toHaveBeenCalledWith(
      expect.stringContaining('[DEBUG]'),
      'Debug message',
      { key: 'value' },
    );
  });

  it('should log info messages', () => {
    logger.info('Info message', 123);
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('[INFO]'),
      'Info message',
      123,
    );
  });

  it('should log warn messages', () => {
    logger.warn('Warning message');
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('[WARN]'), 'Warning message');
  });

  it('should log error messages and capture error details', () => {
    const testError = new Error('Something went wrong');
    logger.error('Error occurred', testError);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('[ERROR]'),
      'Error occurred',
      testError,
    );
    expect(console.error).toHaveBeenCalledWith(
      'Error details:',
      testError.message,
      testError.stack,
    );
  });

  it('should log error messages without error details if not an Error object', () => {
    logger.error('Another error', 'just a string');
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('[ERROR]'),
      'Another error',
      'just a string',
    );
    expect(console.error).not.toHaveBeenCalledWith(
      'Error details:',
      expect.any(String),
      expect.any(String),
    );
  });
});
