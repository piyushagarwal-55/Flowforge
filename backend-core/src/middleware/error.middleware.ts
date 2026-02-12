import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface ErrorResponse {
  error: string;
  code?: string;
  details?: any;
  requestId?: string;
  timestamp: string;
  stack?: string;
}

/**
 * Global error handling middleware
 * Catches all unhandled errors and formats consistent error responses
 */
export function errorMiddleware(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = req.headers['x-request-id'] as string;

  // Log error with full context
  logger.error('Request error', {
    requestId,
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
  });

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Build error response
  const errorResponse: ErrorResponse = {
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString(),
  };

  // Include error code if present
  if (err.code) {
    errorResponse.code = err.code;
  }

  // Include request ID if present
  if (requestId) {
    errorResponse.requestId = requestId;
  }

  // Include details and stack in development mode
  if (process.env.NODE_ENV === 'development') {
    if (err.details) {
      errorResponse.details = err.details;
    }
    if (err.stack) {
      errorResponse.stack = err.stack;
    }
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
}

/**
 * Custom error classes for different error types
 */
export class ValidationError extends Error {
  statusCode = 400;
  code = 'VALIDATION_ERROR';
  details?: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export class AuthenticationError extends Error {
  statusCode = 401;
  code = 'AUTHENTICATION_ERROR';

  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  statusCode = 403;
  code = 'AUTHORIZATION_ERROR';

  constructor(message: string = 'Forbidden') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error {
  statusCode = 404;
  code = 'NOT_FOUND';

  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class DatabaseError extends Error {
  statusCode = 500;
  code = 'DATABASE_ERROR';

  constructor(message: string = 'Database operation failed') {
    super(message);
    this.name = 'DatabaseError';
  }
}
