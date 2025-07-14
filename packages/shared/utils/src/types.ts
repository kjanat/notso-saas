/**
 * Internal types for utils package
 */

// Error context type
export interface ErrorContext {
  [key: string]: string | number | boolean | Date | null | undefined | ErrorContext
}

// Serialized error type
export interface SerializedError {
  message: string
  name: string
  code?: string
  statusCode?: number
  context?: ErrorContext
  stack?: string
}
