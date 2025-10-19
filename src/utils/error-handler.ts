import type { ErrorResponse } from '@/types/snippet.dto';

/**
 * Error codes for standardized error responses
 */
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  AI_SERVICE_ERROR: 'AI_SERVICE_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  code: keyof typeof ERROR_CODES,
  message: string,
  details?: Record<string, any>
): ErrorResponse {
  return {
    error: {
      code: ERROR_CODES[code],
      message,
      ...(details && { details }),
    },
  };
}

/**
 * Create a JSON Response with error
 */
export function errorResponse(
  status: number,
  code: keyof typeof ERROR_CODES,
  message: string,
  details?: Record<string, any>
): Response {
  return new Response(
    JSON.stringify(createErrorResponse(code, message, details)),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Log error to console (in production, this would go to a logging service)
 */
export function logError(
  error: Error | unknown,
  context: Record<string, any> = {}
): void {
  console.error('Error occurred:', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Handle database errors
 */
export function handleDatabaseError(error: any): Response {
  logError(error, { type: 'database_error' });

  // Check for specific Supabase/PostgreSQL errors
  if (error.code === '23505') {
    return errorResponse(400, 'VALIDATION_ERROR', 'Duplicate entry');
  }

  if (error.code === '23503') {
    return errorResponse(400, 'VALIDATION_ERROR', 'Invalid reference');
  }

  // Generic database error
  return errorResponse(500, 'DATABASE_ERROR', 'Failed to perform database operation');
}

/**
 * Handle unexpected errors
 */
export function handleUnexpectedError(error: Error | unknown): Response {
  logError(error, { type: 'unexpected_error' });

  return errorResponse(
    500,
    'INTERNAL_ERROR',
    'An unexpected error occurred'
  );
}
