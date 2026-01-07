import { logger } from '../src/utils/logger';

describe('Logger', () => {
  let consoleLogSpy: jest.SpyInstance;
  let originalEnv: string | undefined;

  beforeEach(() => {
    // Spy on console.log to capture logger output
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    originalEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });

  describe('Log Levels', () => {
    it('should log error messages', () => {
      logger.error('Test error message', { service: 'TestService', chainId: 1 });

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(logOutput.level).toBe('ERROR');
      expect(logOutput.message).toBe('Test error message');
      expect(logOutput.service).toBe('TestService');
      expect(logOutput.chainId).toBe(1);
    });

    it('should log warning messages', () => {
      logger.warn('Test warning message', { service: 'TestService', method: 'testMethod' });

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(logOutput.level).toBe('WARN');
      expect(logOutput.message).toBe('Test warning message');
      expect(logOutput.service).toBe('TestService');
      expect(logOutput.method).toBe('testMethod');
    });

    it('should have info method available', () => {
      // Logger is a singleton initialized at import time
      // Test that info method exists and can be called
      expect(typeof logger.info).toBe('function');

      logger.info('Test info message', { service: 'TestService' });
      // May or may not be logged depending on environment at logger initialization
    });

    it('should have debug method available', () => {
      // Logger is a singleton initialized at import time
      // Test that debug method exists and can be called
      expect(typeof logger.debug).toBe('function');

      logger.debug('Test debug message', { service: 'TestService' });
      // May or may not be logged depending on environment at logger initialization
    });
  });

  describe('Structured Logging', () => {
    it('should output valid JSON format', () => {
      logger.error('JSON test', { key: 'value', number: 42 });

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(typeof logOutput).toBe('object');
      expect(logOutput.level).toBeDefined();
      expect(logOutput.message).toBeDefined();
    });

    it('should include context in log output', () => {
      logger.error('Context test', {
        service: 'ZapService',
        method: 'execute',
        chainId: 1,
        txHash: '0x123',
      });

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(logOutput.service).toBe('ZapService');
      expect(logOutput.method).toBe('execute');
      expect(logOutput.chainId).toBe(1);
      expect(logOutput.txHash).toBe('0x123');
    });

    it('should handle nested objects in context', () => {
      logger.error('Nested test', {
        service: 'TestService',
        data: {
          nested: {
            value: 'test',
            number: 123,
          },
        },
      });

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.data.nested.value).toBe('test');
      expect(logOutput.data.nested.number).toBe(123);
    });

    it('should handle arrays in context', () => {
      logger.error('Array test', {
        service: 'TestService',
        tokens: ['0x123', '0x456'],
      });

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(Array.isArray(logOutput.tokens)).toBe(true);
      expect(logOutput.tokens).toHaveLength(2);
    });
  });

  describe('Sensitive Data Sanitization', () => {
    it('should redact privateKey', () => {
      logger.error('Sensitive data test', {
        service: 'TestService',
        privateKey: '0x1234567890abcdef',
      });

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.privateKey).toBe('[REDACTED]');
    });

    it('should redact apiKey', () => {
      logger.error('API key test', {
        service: 'TestService',
        apiKey: 'secret-api-key',
      });

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.apiKey).toBe('[REDACTED]');
    });

    it('should redact signature', () => {
      logger.error('Signature test', {
        service: 'TestService',
        signature: '0xabcdef123456',
      });

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.signature).toBe('[REDACTED]');
    });

    it('should redact mnemonic', () => {
      logger.error('Mnemonic test', {
        service: 'TestService',
        mnemonic: 'word1 word2 word3',
      });

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.mnemonic).toBe('[REDACTED]');
    });

    it('should redact password', () => {
      logger.error('Password test', {
        service: 'TestService',
        password: 'secret123',
      });

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.password).toBe('[REDACTED]');
    });

    it('should redact secret', () => {
      logger.error('Secret test', {
        service: 'TestService',
        secret: 'my-secret',
      });

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.secret).toBe('[REDACTED]');
    });

    it('should redact nested sensitive data', () => {
      logger.error('Nested sensitive test', {
        service: 'TestService',
        user: {
          name: 'John',
          privateKey: '0xsecret',
          apiKey: 'secret-key',
        },
      });

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.user.name).toBe('John');
      expect(logOutput.user.privateKey).toBe('[REDACTED]');
      expect(logOutput.user.apiKey).toBe('[REDACTED]');
    });

    it('should redact sensitive data in arrays', () => {
      logger.error('Array sensitive test', {
        service: 'TestService',
        users: [
          { name: 'Alice', privateKey: '0x123' },
          { name: 'Bob', apiKey: 'secret' },
        ],
      });

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.users[0].privateKey).toBe('[REDACTED]');
      expect(logOutput.users[1].apiKey).toBe('[REDACTED]');
    });

    it('should preserve non-sensitive data', () => {
      logger.error('Non-sensitive test', {
        service: 'TestService',
        chainId: 1,
        txHash: '0x123abc',
        amount: '1000000',
        address: '0xabcdef',
      });

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.chainId).toBe(1);
      expect(logOutput.txHash).toBe('0x123abc');
      expect(logOutput.amount).toBe('1000000');
      expect(logOutput.address).toBe('0xabcdef');
    });
  });

  describe('Error Serialization', () => {
    it('should serialize Error objects properly', () => {
      const testError = new Error('Test error');
      logger.error('Error serialization test', {
        service: 'TestService',
        error: testError,
      });

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.error.errorName).toBe('Error');
      expect(logOutput.error.errorMessage).toBe('Test error');
    });

    it('should include error stack in development', () => {
      process.env.NODE_ENV = 'development';

      const testError = new Error('Stack trace test');
      logger.error('Stack trace test', {
        service: 'TestService',
        error: testError,
      });

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      // In development, stack should be included
      expect(logOutput.error.stack).toBeDefined();
    });

    it('should handle custom error properties', () => {
      const customError: any = new Error('Custom error');
      customError.code = 4001;
      customError.reason = 'User rejected';

      logger.error('Custom error test', {
        service: 'TestService',
        error: customError,
      });

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.error.errorName).toBe('Error');
      expect(logOutput.error.code).toBe(4001);
      expect(logOutput.error.reason).toBe('User rejected');
    });

    it('should handle non-Error objects', () => {
      logger.error('Non-error object test', {
        service: 'TestService',
        error: { message: 'Not an Error instance', code: 500 },
      });

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.error.message).toBe('Not an Error instance');
      expect(logOutput.error.code).toBe(500);
    });
  });

  describe('Context Handling', () => {
    it('should log without context', () => {
      logger.error('No context test');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(logOutput.level).toBe('ERROR');
      expect(logOutput.message).toBe('No context test');
    });

    it('should handle null values in context', () => {
      logger.error('Null test', {
        service: 'TestService',
        value: null,
      });

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.value).toBeNull();
    });

    it('should handle undefined values in context', () => {
      logger.error('Undefined test', {
        service: 'TestService',
        value: undefined,
      });

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      // Undefined values might not be serialized in JSON
      expect(logOutput.value).toBeUndefined();
    });

    it('should handle multiple context properties', () => {
      logger.error('Multiple context test', {
        service: 'TestService',
        method: 'testMethod',
        chainId: 1,
        txHash: '0x123',
        amount: '1000',
        status: 'failed',
      });

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.service).toBe('TestService');
      expect(logOutput.method).toBe('testMethod');
      expect(logOutput.chainId).toBe(1);
      expect(logOutput.txHash).toBe('0x123');
      expect(logOutput.amount).toBe('1000');
      expect(logOutput.status).toBe('failed');
    });
  });

  describe('Source Location', () => {
    it('should include source location in development mode', () => {
      process.env.NODE_ENV = 'development';

      logger.error('Source location test', { service: 'TestService' });

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      // Source should be included in development
      expect(logOutput.source).toBeDefined();
      expect(typeof logOutput.source).toBe('string');
      // Should be in format "filename:line"
      expect(logOutput.source).toMatch(/.*:\d+/);
    });
  });

  describe('Output Format', () => {
    it('should output valid JSON', () => {
      logger.error('Format test', { service: 'TestService', chainId: 1 });

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const rawOutput = consoleLogSpy.mock.calls[0][0];

      // Should be valid JSON
      expect(() => JSON.parse(rawOutput)).not.toThrow();

      const parsed = JSON.parse(rawOutput);
      expect(parsed.level).toBe('ERROR');
      expect(parsed.message).toBe('Format test');
    });

    it('should output pretty-printed JSON in development', () => {
      process.env.NODE_ENV = 'development';

      logger.error('Development format test', { service: 'TestService', chainId: 1 });

      const rawOutput = consoleLogSpy.mock.calls[0][0];

      // Pretty-printed should have multiple lines
      expect(rawOutput.split('\n').length).toBeGreaterThan(1);

      // Should be valid JSON
      expect(() => JSON.parse(rawOutput)).not.toThrow();
    });
  });

  describe('Real-world Scenarios', () => {
    it('should log transaction failure with full context', () => {
      const testError = new Error('Insufficient funds');
      (testError as any).code = 'INSUFFICIENT_FUNDS';

      logger.error('Transaction failed', {
        service: 'TransactionsService',
        method: 'sendTransaction',
        chainId: 1,
        txHash: '0x123abc',
        error: testError,
      });

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(logOutput.level).toBe('ERROR');
      expect(logOutput.message).toBe('Transaction failed');
      expect(logOutput.service).toBe('TransactionsService');
      expect(logOutput.method).toBe('sendTransaction');
      expect(logOutput.chainId).toBe(1);
      expect(logOutput.error.errorMessage).toBe('Insufficient funds');
      expect(logOutput.error.code).toBe('INSUFFICIENT_FUNDS');
    });

    it('should log zap execution with sanitized data', () => {
      logger.error('Zap execution failed', {
        service: 'ZapService',
        method: 'executeZap',
        chainId: 1,
        srcToken: '0xTokenA',
        destToken: '0xTokenB',
        amount: '1000000',
        privateKey: 'should-be-redacted',
        error: new Error('Execution failed'),
      });

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(logOutput.privateKey).toBe('[REDACTED]');
      expect(logOutput.srcToken).toBe('0xTokenA');
      expect(logOutput.destToken).toBe('0xTokenB');
      expect(logOutput.amount).toBe('1000000');
    });

    it('should log API failures', () => {
      logger.error('API call failed', {
        service: 'PriceService',
        method: 'fetchPrices',
        chainId: 1,
        provider: 'coingecko',
        error: { status: 429, message: 'Rate limited' },
      });

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(logOutput.level).toBe('ERROR');
      expect(logOutput.service).toBe('PriceService');
      expect(logOutput.chainId).toBe(1);
      expect(logOutput.provider).toBe('coingecko');
      expect(logOutput.error.status).toBe(429);
    });

    it('should log permit signature failures', () => {
      const signatureError = new Error('User rejected signature');
      (signatureError as any).code = 4001;

      logger.error('Permit signature failed', {
        service: 'SignatureService',
        method: 'signPermit',
        chainId: 1,
        tokenAddress: '0xToken',
        error: signatureError,
      });

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(logOutput.tokenAddress).toBe('0xToken');
      expect(logOutput.error.errorMessage).toBe('User rejected signature');
      expect(logOutput.error.code).toBe(4001);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty context object', () => {
      logger.error('Empty context', {});

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.level).toBe('ERROR');
      expect(logOutput.message).toBe('Empty context');
    });

    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(1000);
      logger.error(longMessage, { service: 'TestService' });

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.message).toBe(longMessage);
    });

    it('should handle special characters in message', () => {
      logger.error('Special chars: "quotes" and \'apostrophes\' and \n newlines', {
        service: 'TestService',
      });

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.message).toContain('quotes');
      expect(logOutput.message).toContain('apostrophes');
    });

    it('should handle circular references gracefully', () => {
      const circular: any = { service: 'TestService', data: 'test', count: 1 };
      circular.self = circular;

      // Should not crash with circular references
      let didThrow = false;
      try {
        logger.error('Circular reference test', circular);
      } catch (e) {
        didThrow = true;
      }

      expect(didThrow).toBe(false);

      // Verify it was logged and produced valid JSON
      const lastCallIndex = consoleLogSpy.mock.calls.length - 1;
      const rawOutput = consoleLogSpy.mock.calls[lastCallIndex][0];

      // Should produce valid JSON (not crash with circular reference)
      expect(() => JSON.parse(rawOutput)).not.toThrow();

      const logOutput = JSON.parse(rawOutput);
      expect(logOutput.message).toBe('Circular reference test');
      expect(logOutput.level).toBe('ERROR');

      // Circular reference should be handled (either '[Circular]' or omitted)
      expect(logOutput.self).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should handle high-frequency logging', () => {
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        logger.error(`Log ${i}`, { service: 'TestService', iteration: i });
      }

      expect(consoleLogSpy).toHaveBeenCalledTimes(iterations);
    });

    it('should not block on logging', () => {
      const startTime = Date.now();

      logger.error('Performance test', {
        service: 'TestService',
        largeData: new Array(1000).fill('data'),
      });

      const duration = Date.now() - startTime;

      // Logging should be fast (< 100ms for single log)
      expect(duration).toBeLessThan(100);
    });
  });
});
