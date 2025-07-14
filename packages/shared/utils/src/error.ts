import type { ErrorContext, SerializedError } from './types'

export class BaseError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly context?: ErrorContext

  constructor(
    message: string,
    code: string,
    statusCode = 500,
    isOperational = true,
    context?: ErrorContext
  ) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.context = context
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends BaseError {
  constructor(message: string, context?: ErrorContext) {
    super(message, 'VALIDATION_ERROR', 400, true, context)
  }
}

export class AuthenticationError extends BaseError {
  constructor(message = 'Authentication failed', context?: ErrorContext) {
    super(message, 'AUTHENTICATION_ERROR', 401, true, context)
  }
}

export class AuthorizationError extends BaseError {
  constructor(message = 'Access denied', context?: ErrorContext) {
    super(message, 'AUTHORIZATION_ERROR', 403, true, context)
  }
}

export class NotFoundError extends BaseError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`
    super(message, 'NOT_FOUND', 404, true, { identifier, resource })
  }
}

export class ConflictError extends BaseError {
  constructor(message: string, context?: ErrorContext) {
    super(message, 'CONFLICT', 409, true, context)
  }
}

export class RateLimitError extends BaseError {
  constructor(message = 'Rate limit exceeded', retryAfter?: number, context?: ErrorContext) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, true, {
      ...context,
      retryAfter,
    })
  }
}

export class ExternalServiceError extends BaseError {
  constructor(service: string, originalError?: Error, context?: ErrorContext) {
    const message = `External service error: ${service}`
    super(message, 'EXTERNAL_SERVICE_ERROR', 502, false, {
      ...context,
      originalError: originalError?.message,
      service,
    })
  }
}

export class DatabaseError extends BaseError {
  constructor(operation: string, originalError?: Error) {
    const message = `Database operation failed: ${operation}`
    super(message, 'DATABASE_ERROR', 500, false, {
      operation,
      originalError: originalError?.message,
    })
  }
}

export class ConfigurationError extends BaseError {
  constructor(message: string, context?: ErrorContext) {
    super(message, 'CONFIGURATION_ERROR', 500, false, context)
  }
}

export function isOperationalError(error: Error): boolean {
  if (error instanceof BaseError) {
    return error.isOperational
  }
  return false
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'An unknown error occurred'
}

export function serializeError(error: Error): SerializedError {
  const serialized: SerializedError = {
    message: error.message,
    name: error.name,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  }

  if (error instanceof BaseError) {
    serialized.code = error.code
    serialized.statusCode = error.statusCode
    serialized.context = error.context
  }

  return serialized
}

export function createErrorResponse(error: Error) {
  if (error instanceof BaseError) {
    return {
      error: {
        code: error.code,
        message: error.message,
        ...(process.env.NODE_ENV === 'development' && {
          context: error.context,
          stack: error.stack,
        }),
      },
      success: false,
    }
  }

  return {
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'An internal error occurred' : error.message,
    },
    success: false,
  }
}

export class ErrorHandler {
  private static instance: ErrorHandler
  private handlers: Map<string, (error: BaseError) => void> = new Map()

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  registerHandler(errorCode: string, handler: (error: BaseError) => void): void {
    this.handlers.set(errorCode, handler)
  }

  handle(error: Error): void {
    if (error instanceof BaseError && this.handlers.has(error.code)) {
      const handler = this.handlers.get(error.code)!
      handler(error)
    }

    if (!isOperationalError(error)) {
      console.error('Unhandled error:', error)
      process.exit(1)
    }
  }
}
