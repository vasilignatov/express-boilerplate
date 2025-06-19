import { Request, Response, NextFunction } from "express";
import { logger } from "../services/logger";

/**
 * Request logging middleware
 * Logs all incoming requests with timing and response information
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();

  // Add start time to request for use in other middleware
  (req as any).startTime = startTime;

  // Log incoming request
  logger.info(
    {
      req: {
        method: req.method,
        url: req.url,
        headers: {
          "user-agent": req.get("user-agent"),
          accept: req.get("accept"),
          "content-type": req.get("content-type"),
          authorization: req.get("authorization") ? "[REDACTED]" : undefined,
        },
        ip: req.ip,
        query: req.query,
        params: req.params,
      },
      timestamp: new Date().toISOString(),
    },
    `Incoming ${req.method} ${req.url}`
  );

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function (chunk?: any, encoding?: any) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Determine log level based on status code
    const logLevel = res.statusCode >= 400 ? "error" : "info";

    // Log response
    logger[logLevel](
      {
        req: {
          method: req.method,
          url: req.url,
          ip: req.ip,
        },
        res: {
          statusCode: res.statusCode,
          contentLength: res.get("content-length"),
          contentType: res.get("content-type"),
        },
        responseTime,
        timestamp: new Date().toISOString(),
      },
      `${req.method} ${req.url} ${res.statusCode} - ${responseTime}ms`
    );

    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

/**
 * Enhanced request logger with additional context
 */
export const enhancedRequestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();
  const requestId = generateRequestId();

  // Add request ID and start time to request
  (req as any).requestId = requestId;
  (req as any).startTime = startTime;

  // Add request ID to response headers
  res.setHeader("X-Request-ID", requestId);

  // Create child logger with request context
  const requestLogger = logger.child({
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
  });

  // Add logger to request for use in route handlers
  (req as any).logger = requestLogger;

  // Log incoming request
  requestLogger.info(
    {
      req: {
        method: req.method,
        url: req.url,
        headers: {
          "user-agent": req.get("user-agent"),
          accept: req.get("accept"),
          "content-type": req.get("content-type"),
          host: req.get("host"),
          referer: req.get("referer"),
          "x-forwarded-for": req.get("x-forwarded-for"),
        },
        ip: req.ip,
        query: Object.keys(req.query).length > 0 ? req.query : undefined,
        params: Object.keys(req.params).length > 0 ? req.params : undefined,
        body: shouldLogBody(req) ? sanitizeBody(req.body) : undefined,
      },
      timestamp: new Date().toISOString(),
    },
    "Request started"
  );

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function (chunk?: any, encoding?: any) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Determine log level based on status code
    const logLevel = getLogLevel(res.statusCode);

    // Log response
    requestLogger[logLevel](
      {
        res: {
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          contentLength: res.get("content-length"),
          contentType: res.get("content-type"),
        },
        responseTime,
        timestamp: new Date().toISOString(),
      },
      `Request completed - ${res.statusCode} - ${responseTime}ms`
    );

    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

/**
 * Request logger for specific routes or middleware
 */
export const routeLogger = (routeName: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const requestLogger = (req as any).logger || logger;

    requestLogger.info(
      {
        route: routeName,
        method: req.method,
        url: req.url,
        timestamp: new Date().toISOString(),
      },
      `Route handler: ${routeName}`
    );

    next();
  };
};

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Determine if request body should be logged
 */
function shouldLogBody(req: Request): boolean {
  const contentType = req.get("content-type") || "";

  // Don't log file uploads or large payloads
  if (
    contentType.includes("multipart/form-data") ||
    contentType.includes("application/octet-stream")
  ) {
    return false;
  }

  // Don't log if body is too large
  const contentLength = parseInt(req.get("content-length") || "0");
  if (contentLength > 1024 * 10) {
    // 10KB limit
    return false;
  }

  return true;
}

/**
 * Sanitize request body for logging
 */
function sanitizeBody(body: any): any {
  if (!body || typeof body !== "object") {
    return body;
  }

  const sensitiveFields = [
    "password",
    "token",
    "secret",
    "key",
    "authorization",
  ];
  const sanitized = { ...body };

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = "[REDACTED]";
    }
  }

  return sanitized;
}

/**
 * Get log level based on status code
 */
function getLogLevel(statusCode: number): "info" | "warn" | "error" {
  if (statusCode >= 500) {
    return "error";
  } else if (statusCode >= 400) {
    return "warn";
  } else {
    return "info";
  }
}
