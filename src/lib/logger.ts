import { config } from "./config";

type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  stack?: string;
}

// ─── Logger Class ────────────────────────────────────────────────────────────

class Logger {
  private minLevel: number;
  private context: LogContext;

  constructor(context: LogContext = {}) {
    this.minLevel = LOG_LEVELS[config.logging.level] ?? LOG_LEVELS.info;
    this.context = context;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= this.minLevel;
  }

  private formatEntry(entry: LogEntry): string {
    const parts = [
      `[${entry.timestamp}]`,
      `[${entry.level.toUpperCase()}]`,
      entry.message,
    ];

    if (entry.context && Object.keys(entry.context).length > 0) {
      parts.push(JSON.stringify(entry.context));
    }

    if (entry.stack) {
      parts.push(`\n${entry.stack}`);
    }

    return parts.join(" ");
  }

  private createEntry(level: LogLevel, message: string, context?: LogContext): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: {
        ...this.context,
        ...context,
      },
    };
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) return;

    const entry = this.createEntry(level, message, context);

    switch (level) {
      case "debug":
        console.debug(this.formatEntry(entry));
        break;
      case "info":
        console.info(this.formatEntry(entry));
        break;
      case "warn":
        console.warn(this.formatEntry(entry));
        break;
      case "error":
        console.error(this.formatEntry(entry));
        if (entry.context?.error instanceof Error) {
          console.error(entry.context.error.stack);
        }
        break;
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log("debug", message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log("info", message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log("warn", message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log("error", message, context);
  }

  child(context: LogContext): Logger {
    return new Logger({
      ...this.context,
      ...context,
    });
  }

  // ─── Structured Logging Methods ──────────────────────────────────────────

  logRequest(method: string, path: string, statusCode: number, duration: number, context?: LogContext): void {
    this.info("HTTP Request", {
      method,
      path,
      statusCode,
      duration,
      ...context,
    });
  }

  logError(error: Error, context?: LogContext): void {
    this.error(error.message, {
      ...context,
      error,
      name: error.name,
      stack: error.stack,
    });
  }

  logAuth(event: string, userId?: string, context?: LogContext): void {
    this.info(`Auth: ${event}`, {
      userId,
      ...context,
    });
  }

  logDatabase(operation: string, table: string, duration: number, context?: LogContext): void {
    this.debug(`DB: ${operation} on ${table}`, {
      duration,
      ...context,
    });
  }

  logWebSocket(event: string, context?: LogContext): void {
    this.info(`WebSocket: ${event}`, context);
  }

  logCollaboration(event: string, documentId: string, userId: string, context?: LogContext): void {
    this.info(`Collaboration: ${event}`, {
      documentId,
      userId,
      ...context,
    });
  }

  logAI(operation: string, duration: number, context?: LogContext): void {
    this.info(`AI: ${operation}`, {
      duration,
      ...context,
    });
  }

  logPerformance(operation: string, duration: number, context?: LogContext): void {
    if (duration > 1000) {
      this.warn(`Slow operation: ${operation}`, {
        duration,
        ...context,
      });
    } else {
      this.debug(`Performance: ${operation}`, {
        duration,
        ...context,
      });
    }
  }
}

// ─── Request Logger Middleware ────────────────────────────────────────────────

import { NextApiRequest, NextApiResponse } from "next";

export function withRequestLogger(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const start = Date.now();
    const logger = new Logger({
      requestId: crypto.randomUUID(),
      method: req.method,
      path: req.url,
    });

    // Attach logger to request
    (req as any).logger = logger;

    // Log response
    const originalEnd = res.end;
    res.end = function (this: NextApiResponse, ...args: any[]) {
      const duration = Date.now() - start;
      logger.logRequest(req.method ?? "UNKNOWN", req.url ?? "UNKNOWN", res.statusCode, duration);
      return originalEnd.apply(this, args as any);
    } as any;

    try {
      await handler(req, res);
    } catch (error) {
      const duration = Date.now() - start;
      logger.error("Unhandled error in API route", {
        duration,
        error: error instanceof Error ? error : new Error(String(error)),
      });
      throw error;
    }
  };
}

// ─── Performance Timer ───────────────────────────────────────────────────────

export class PerformanceTimer {
  private logger: Logger;
  private operation: string;
  private startTime: number;

  constructor(logger: Logger, operation: string) {
    this.logger = logger;
    this.operation = operation;
    this.startTime = performance.now();
  }

  end(context?: LogContext): number {
    const duration = Math.round(performance.now() - this.startTime);
    this.logger.logPerformance(this.operation, duration, context);
    return duration;
  }
}

export function startTimer(logger: Logger, operation: string): PerformanceTimer {
  return new PerformanceTimer(logger, operation);
}

// ─── Log Buffer for Batch Writing ────────────────────────────────────────────

class LogBuffer {
  private buffer: LogEntry[] = [];
  private maxBufferSize: number;
  private flushInterval: NodeJS.Timeout | null = null;

  constructor(maxBufferSize: number = 100) {
    this.maxBufferSize = maxBufferSize;
  }

  add(entry: LogEntry): void {
    this.buffer.push(entry);
    if (this.buffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  flush(): void {
    if (this.buffer.length === 0) return;

    const entries = [...this.buffer];
    this.buffer = [];

    // In production, send to logging service
    if (config.app.isProd) {
      // TODO: Send to logging service (e.g., Datadog, Sentry, etc.)
      console.log(JSON.stringify(entries));
    }
  }

  startAutoFlush(intervalMs: number = 30000): void {
    this.flushInterval = setInterval(() => this.flush(), intervalMs);
  }

  stopAutoFlush(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }
}

// ─── Singleton Logger ────────────────────────────────────────────────────────

export const logger = new Logger();

export const logBuffer = new LogBuffer();

if (config.app.isProd) {
  logBuffer.startAutoFlush();
}

// ─── Helper Functions ────────────────────────────────────────────────────────

export function createLogger(context: LogContext): Logger {
  return new Logger(context);
}

export function logError(error: unknown, context?: LogContext): void {
  if (error instanceof Error) {
    logger.error(error.message, {
      ...context,
      error,
      stack: error.stack,
    });
  } else {
    logger.error(String(error), context);
  }
}

export function logDuration<T>(operation: string, fn: () => T, context?: LogContext): T {
  const start = performance.now();
  const result = fn();
  const duration = Math.round(performance.now() - start);
  logger.logPerformance(operation, duration, context);
  return result;
}

export async function logAsyncDuration<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: LogContext,
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = Math.round(performance.now() - start);
    logger.logPerformance(operation, duration, { ...context, success: true });
    return result;
  } catch (error) {
    const duration = Math.round(performance.now() - start);
    logger.logPerformance(operation, duration, { ...context, success: false });
    throw error;
  }
}

export default logger;
