import { AxiosError } from 'axios';

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

type LogContext = {
  service?: string;
  method?: string;
  chainId?: number;
  [key: string]: unknown;
};

type LogEntry = {
  level: string;
  message: string;
  [key: string]: unknown;
};

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private isProd: boolean;

  private constructor() {
    const nodeEnv = typeof process !== 'undefined' ? process.env.NODE_ENV : 'development';
    this.isProd = nodeEnv === 'production';

    if (nodeEnv === 'test') {
      this.logLevel = LogLevel.WARN;
    } else if (this.isProd) {
      this.logLevel = LogLevel.ERROR;
    } else {
      this.logLevel = LogLevel.INFO;
    }
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Sanitize sensitive data from log context
   */
  private sanitize(context: LogContext): LogContext {
    const sensitiveKeys = ['privateKey', 'apiKey', 'signature', 'mnemonic', 'seed', 'secret', 'password', 'authorization'];

    const sanitized = { ...context };
    const seen = new WeakSet();

    // Recursively sanitize nested objects with circular reference detection
    const sanitizeValue = (obj: unknown): unknown => {
      if (obj === null || obj === undefined) return obj;

      if (Array.isArray(obj)) {
        return obj.map(sanitizeValue);
      }

      if (typeof obj === 'object' && !(obj instanceof Error)) {
        // Detect circular references
        if (seen.has(obj)) {
          return '[Circular]';
        }
        seen.add(obj);

        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
          const lowerKey = key.toLowerCase();

          const isSensitive = sensitiveKeys.some((sensitiveKey) => lowerKey.includes(sensitiveKey.toLowerCase()));

          if (isSensitive) {
            result[key] = '[REDACTED]';
          } else {
            result[key] = sanitizeValue(value);
          }
        }
        return result;
      }

      return obj;
    };

    return sanitizeValue(sanitized) as LogContext;
  }

  /**
   * Check if error is an Axios error
   */
  private isAxiosError(error: unknown): error is AxiosError {
    return Boolean(error) && (error as AxiosError).isAxiosError === true;
  }

  /**
   * Serialize Axios error with detailed HTTP context
   */
  private serializeAxiosError(error: AxiosError): Record<string, unknown> {
    const serialized: Record<string, unknown> = {
      errorName: 'AxiosError',
      errorMessage: error.message,
      errorCode: error.code, // e.g., 'ECONNABORTED', 'ERR_NETWORK', 'ERR_BAD_REQUEST'
    };

    // Include stack trace in non-production
    if (!this.isProd && error.stack) {
      serialized.stack = error.stack;
    }

    // Add HTTP request details (if available)
    if (error.config) {
      const requestInfo: Record<string, unknown> = {
        method: error.config.method?.toUpperCase(),
        url: error.config.url,
        baseURL: error.config.baseURL,
        headers: this.sanitize(error.config.headers as Record<string, unknown>),
      };

      // Include request params/data in non-production
      if (!this.isProd) {
        if (error.config.params) {
          requestInfo.params = this.sanitize(error.config.params);
        }
        if (error.config.data) {
          try {
            const parsedData = typeof error.config.data === 'string' ? JSON.parse(error.config.data) : error.config.data;
            requestInfo.data = this.sanitize(parsedData);
          } catch {
            requestInfo.data = '[Unable to parse request data]';
          }
        }
      }

      serialized.request = requestInfo;
    }

    if (error.response) {
      const responseInfo: Record<string, unknown> = {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      };

      if (!this.isProd && error.response.headers) {
        responseInfo.headers = this.sanitize(error.response.headers as Record<string, unknown>);
      }

      serialized.response = responseInfo;
    } else if (error.request) {
      // Request was made but no response received (network error, timeout, etc.)
      serialized.errorType = 'NO_RESPONSE';
      serialized.errorContext = 'Request was sent but no response was received. This could be due to network issues, server being down, or timeout.';
    } else {
      // Error occurred during request setup
      serialized.errorType = 'REQUEST_SETUP';
      serialized.errorContext = 'Error occurred while setting up the request.';
    }

    return serialized;
  }

  /**
   * Serialize error objects properly
   */
  private serializeError(error: unknown): unknown {
    if (this.isAxiosError(error)) {
      return this.serializeAxiosError(error);
    }
    if (error instanceof Error) {
      const serialized: Record<string, unknown> = {
        errorName: error.name,
        errorMessage: error.message,
      };

      if (!this.isProd && error.stack) {
        serialized.stack = error.stack;
      }

      // Add any additional enumerable properties
      const errorObj = error as unknown as Record<string, unknown>;
      for (const key in errorObj) {
        if (Object.prototype.hasOwnProperty.call(errorObj, key) && key !== 'name' && key !== 'message' && key !== 'stack') {
          serialized[key] = errorObj[key];
        }
      }

      return serialized;
    }
    return error;
  }

  /**
   * Get the source location (file:line) of the log call
   */
  private getSourceLocation(): string | undefined {
    if (this.isProd) {
      return undefined; // Skip in production for performance
    }

    try {
      const stack = new Error().stack;
      if (!stack) return undefined;

      // Parse stack trace to find the caller (skip Error, getSourceLocation, log, and the log method)
      const lines = stack.split('\n');
      // Typically: lines[0] = "Error", lines[1] = "at getSourceLocation", lines[2] = "at log", lines[3] = "at debug/info/warn/error", lines[4] = actual caller
      const callerLine = lines[4];
      if (!callerLine) return undefined;

      // Extract file path and line number from stack trace
      // Format is typically: "at Object.<anonymous> (/path/to/file.ts:123:45)"
      const match = callerLine.match(/\((.+):(\d+):(\d+)\)/) || callerLine.match(/at (.+):(\d+):(\d+)/);
      if (!match) return undefined;

      const fullPath = match[1];
      const line = match[2];

      // Extract just the filename from the full path
      const filename = fullPath.split('/').pop() || fullPath;

      return `${filename}:${line}`;
    } catch (e) {
      return undefined;
    }
  }

  /**
   * Format and output log entry
   */
  private log(level: LogLevel, levelName: string, message: string, context?: LogContext): void {
    if (level < this.logLevel) {
      return; // Skip logs below current level
    }

    let sanitizedContext: Record<string, unknown> = {};
    if (context) {
      sanitizedContext = this.sanitize(context) as Record<string, unknown>;

      // Serialize errors properly
      if (sanitizedContext.error) {
        sanitizedContext.error = this.serializeError(sanitizedContext.error);
      }
    }

    const logEntry: LogEntry = {
      level: levelName,
      message,
      ...sanitizedContext,
    };

    if (!this.isProd) {
      const source = this.getSourceLocation();
      if (source) {
        logEntry.source = source;
      }
    }

    if (this.isProd) {
      // Production: compact JSON on a single line
      console.log(JSON.stringify(logEntry));
    } else {
      // Development: pretty-printed for readability
      console.log(JSON.stringify(logEntry, null, 2));
    }
  }

  public debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, 'DEBUG', message, context);
  }

  public info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, 'INFO', message, context);
  }

  public warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, 'WARN', message, context);
  }

  public error(message: string, context?: LogContext): void {
    this.log(LogLevel.ERROR, 'ERROR', message, context);
  }
}

export const logger = Logger.getInstance();
