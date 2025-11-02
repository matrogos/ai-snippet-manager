import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ERROR_CODES,
  createErrorResponse,
  errorResponse,
  handleDatabaseError,
  handleUnexpectedError,
  logError,
} from '@/utils/error-handler';

describe('error-handler', () => {

  describe('ERROR_CODES', () => {

    test('contains all expected error codes', () => {
      expect(ERROR_CODES).toHaveProperty('VALIDATION_ERROR');
      expect(ERROR_CODES).toHaveProperty('UNAUTHORIZED');
      expect(ERROR_CODES).toHaveProperty('FORBIDDEN');
      expect(ERROR_CODES).toHaveProperty('NOT_FOUND');
      expect(ERROR_CODES).toHaveProperty('DATABASE_ERROR');
      expect(ERROR_CODES).toHaveProperty('INTERNAL_ERROR');
      expect(ERROR_CODES).toHaveProperty('AI_SERVICE_ERROR');
      expect(ERROR_CODES).toHaveProperty('SERVICE_UNAVAILABLE');
    });

    test('error codes are strings', () => {
      Object.values(ERROR_CODES).forEach(code => {
        expect(typeof code).toBe('string');
      });
    });
  });

  describe('createErrorResponse', () => {

    test('creates error response with code and message', () => {
      const response = createErrorResponse('VALIDATION_ERROR', 'Invalid input');

      expect(response).toHaveProperty('error');
      expect(response.error).toHaveProperty('code');
      expect(response.error).toHaveProperty('message');
      expect(response.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(response.error.message).toBe('Invalid input');
    });

    test('includes details when provided', () => {
      const details = { field: 'email', reason: 'Invalid format' };
      const response = createErrorResponse('VALIDATION_ERROR', 'Invalid input', details);

      expect(response.error).toHaveProperty('details');
      expect(response.error.details).toEqual(details);
    });

    test('omits details when not provided', () => {
      const response = createErrorResponse('NOT_FOUND', 'Resource not found');

      expect(response.error).not.toHaveProperty('details');
    });

    test('uses correct ERROR_CODES constant', () => {
      const response = createErrorResponse('UNAUTHORIZED', 'Not authenticated');

      expect(response.error.code).toBe('UNAUTHORIZED');
      expect(response.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    });

    test('creates response for all error code types', () => {
      const errorTypes: Array<keyof typeof ERROR_CODES> = [
        'VALIDATION_ERROR',
        'UNAUTHORIZED',
        'FORBIDDEN',
        'NOT_FOUND',
        'DATABASE_ERROR',
        'INTERNAL_ERROR',
        'AI_SERVICE_ERROR',
        'SERVICE_UNAVAILABLE',
      ];

      errorTypes.forEach(type => {
        const response = createErrorResponse(type, 'Test message');
        expect(response.error.code).toBe(ERROR_CODES[type]);
      });
    });
  });

  describe('errorResponse', () => {

    test('returns Response object with correct status', () => {
      const response = errorResponse(400, 'VALIDATION_ERROR', 'Invalid input');

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(400);
    });

    test('returns Response with correct Content-Type header', () => {
      const response = errorResponse(404, 'NOT_FOUND', 'Not found');

      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    test('returns Response with JSON body', async () => {
      const response = errorResponse(500, 'INTERNAL_ERROR', 'Internal error');
      const body = await response.json();

      expect(body).toHaveProperty('error');
      expect(body.error).toHaveProperty('code');
      expect(body.error).toHaveProperty('message');
    });

    test('includes error code in response body', async () => {
      const response = errorResponse(403, 'FORBIDDEN', 'Access denied');
      const body = await response.json();

      expect(body.error.code).toBe(ERROR_CODES.FORBIDDEN);
    });

    test('includes error message in response body', async () => {
      const response = errorResponse(400, 'VALIDATION_ERROR', 'Invalid email');
      const body = await response.json();

      expect(body.error.message).toBe('Invalid email');
    });

    test('includes details in response body when provided', async () => {
      const details = { errors: [{ field: 'email', message: 'Invalid format' }] };
      const response = errorResponse(400, 'VALIDATION_ERROR', 'Validation failed', details);
      const body = await response.json();

      expect(body.error.details).toEqual(details);
    });

    test('creates 401 response for UNAUTHORIZED', async () => {
      const response = errorResponse(401, 'UNAUTHORIZED', 'Not authenticated');

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error.code).toBe('UNAUTHORIZED');
    });

    test('creates 500 response for INTERNAL_ERROR', async () => {
      const response = errorResponse(500, 'INTERNAL_ERROR', 'Server error');

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('handleDatabaseError', () => {

    let consoleErrorSpy: any;

    beforeEach(() => {
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    test('handles PostgreSQL duplicate entry error (23505)', async () => {
      const error = { code: '23505', message: 'Duplicate key' };
      const response = handleDatabaseError(error);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.message).toBe('Duplicate entry');
    });

    test('handles PostgreSQL foreign key violation (23503)', async () => {
      const error = { code: '23503', message: 'Foreign key violation' };
      const response = handleDatabaseError(error);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.message).toBe('Invalid reference');
    });

    test('handles generic database errors', async () => {
      const error = { code: 'UNKNOWN', message: 'Database error' };
      const response = handleDatabaseError(error);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error.code).toBe('DATABASE_ERROR');
    });

    test('returns 400 status for validation errors', async () => {
      const error = { code: '23505' };
      const response = handleDatabaseError(error);

      expect(response.status).toBe(400);
    });

    test('returns 500 status for generic errors', async () => {
      const error = new Error('Generic database error');
      const response = handleDatabaseError(error);

      expect(response.status).toBe(500);
    });

    test('calls logError internally', () => {
      const error = { code: '23505' };
      handleDatabaseError(error);

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('handleUnexpectedError', () => {

    let consoleErrorSpy: any;

    beforeEach(() => {
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    test('handles Error objects', async () => {
      const error = new Error('Unexpected error');
      const response = handleUnexpectedError(error);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(500);
    });

    test('handles unknown error types', async () => {
      const error = 'String error';
      const response = handleUnexpectedError(error);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(500);
    });

    test('returns 500 status code', () => {
      const error = new Error('Test error');
      const response = handleUnexpectedError(error);

      expect(response.status).toBe(500);
    });

    test('returns INTERNAL_ERROR code', async () => {
      const error = new Error('Test error');
      const response = handleUnexpectedError(error);
      const body = await response.json();

      expect(body.error.code).toBe('INTERNAL_ERROR');
    });

    test('returns generic error message', async () => {
      const error = new Error('Sensitive internal details');
      const response = handleUnexpectedError(error);
      const body = await response.json();

      expect(body.error.message).toBe('An unexpected error occurred');
    });

    test('does not leak error details to client', async () => {
      const error = new Error('Database connection string: postgres://secret');
      const response = handleUnexpectedError(error);
      const body = await response.json();

      expect(body.error.message).not.toContain('secret');
      expect(body.error.message).not.toContain('Database connection');
    });

    test('calls logError internally', () => {
      const error = new Error('Test error');
      handleUnexpectedError(error);

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('logError', () => {

    let consoleErrorSpy: any;

    beforeEach(() => {
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    test('logs error message', () => {
      const error = new Error('Test error');
      logError(error);

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    test('logs error stack trace', () => {
      const error = new Error('Test error');
      logError(error);

      const loggedData = consoleErrorSpy.mock.calls[0][1];
      expect(loggedData).toHaveProperty('stack');
    });

    test('logs context data', () => {
      const error = new Error('Test error');
      const context = { userId: '123', action: 'createSnippet' };
      logError(error, context);

      const loggedData = consoleErrorSpy.mock.calls[0][1];
      expect(loggedData.context).toEqual(context);
    });

    test('logs timestamp', () => {
      const error = new Error('Test error');
      logError(error);

      const loggedData = consoleErrorSpy.mock.calls[0][1];
      expect(loggedData).toHaveProperty('timestamp');
      expect(typeof loggedData.timestamp).toBe('string');
    });

    test('handles Error objects', () => {
      const error = new Error('Test error message');
      logError(error);

      const loggedData = consoleErrorSpy.mock.calls[0][1];
      expect(loggedData.error).toBe('Test error message');
    });

    test('handles non-Error objects', () => {
      const error = 'String error';
      logError(error);

      const loggedData = consoleErrorSpy.mock.calls[0][1];
      expect(loggedData.error).toBe('String error');
    });

    test('handles null context', () => {
      const error = new Error('Test');
      logError(error, {});

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    test('includes error type in log', () => {
      const error = new Error('Test');
      logError(error, { type: 'database_error' });

      const loggedData = consoleErrorSpy.mock.calls[0][1];
      expect(loggedData.context.type).toBe('database_error');
    });
  });
});
