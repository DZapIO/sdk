import { AxiosError, isAxiosError } from 'axios';
import { BaseError } from 'viem';

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
   * Check if error is a Viem BaseError
   */
  private isViemError(error: unknown): error is BaseError {
    return error instanceof BaseError;
  }

  /**
   * Serialize Axios error with detailed HTTP context
   */
  private serializeAxiosError(error: AxiosError): Record<string, unknown> {
    const url = error.config?.url || error.request?.responseURL;
    let body: unknown = error.response?.data;
    if (!body && error.config?.data) {
      try {
        body = typeof error.config.data === 'string' ? JSON.parse(error.config.data) : error.config.data;
      } catch {
        body = error.config.data;
      }
    }

    return {
      name: 'AxiosError',
      message: error.message,
      errorCode: error.code,
      ...(error.response?.status && { statusCode: error.response.status }),
      ...(url && { url }),
      ...(body !== undefined && { body }),
      ...((error.config || error.request) && {
        request: {
          method: error.config?.method?.toUpperCase(),
          url,
          baseURL: error.config?.baseURL,
          ...(error.request && { hasRequest: true }),
        },
      }),
      ...(!this.isProd && error.stack && { stack: error.stack }),
    };
  }

  /**
   * Serialize Viem BaseError with detailed context
   */
  private serializeViemError(error: BaseError): Record<string, unknown> {
    return {
      name: error.name,
      message: error.shortMessage || error.message,
      ...(error.details && { details: error.details }),
      ...(!this.isProd && error.stack && { stack: error.stack }),
    };
  }

  /**
   * Serialize error objects properly
   */
  private serializeError(error: unknown): unknown {
    if (isAxiosError(error)) return this.serializeAxiosError(error);
    if (this.isViemError(error)) return this.serializeViemError(error);
    if (!(error instanceof Error)) return error;

    const serialized: Record<string, unknown> = {
      name: error.name,
      message: error.message,
      ...(!this.isProd && error.stack && { stack: error.stack }),
    };

    return serialized;
  }

  /**
   * Format and output log entry
   */
  private log(level: LogLevel, levelName: string, message: string, context?: LogContext): void {
    if (level < this.logLevel) return;

    const sanitizedContext = context ? { ...context } : {};
    if (sanitizedContext.error) {
      sanitizedContext.error = this.serializeError(sanitizedContext.error);
    }

    const logEntry: LogEntry = { level: levelName, message, ...sanitizedContext };
    console.log(JSON.stringify(logEntry, null, this.isProd ? 0 : 2));
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
