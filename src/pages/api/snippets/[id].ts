import type { APIRoute } from 'astro';
import { requireAuth } from '@/middleware/auth.middleware';
import { validateSnippetId, formatValidationErrors } from '@/validators/snippet.validator';
import { SnippetService } from '@/services/snippet.service';
import { errorResponse, handleDatabaseError, handleUnexpectedError } from '@/utils/error-handler';
import type { GetSnippetByIdCommand } from '@/types/snippet.dto';

/**
 * GET /api/snippets/{id}
 * Retrieve a specific snippet by its ID for the authenticated user
 */
export const GET: APIRoute = async (context) => {
  try {
    // 1. Authenticate user
    const { user_id, access_token } = await requireAuth(context);

    // 2. Extract and validate path parameter
    const id = context.params.id;

    if (!id) {
      return errorResponse(
        400,
        'VALIDATION_ERROR',
        'Snippet ID is required'
      );
    }

    // 3. Validate UUID format
    const validation = validateSnippetId(id);

    if (!validation.success) {
      return errorResponse(
        400,
        'VALIDATION_ERROR',
        'Invalid snippet ID format',
        formatValidationErrors(validation.error)
      );
    }

    // 4. Build service command
    const command: GetSnippetByIdCommand = {
      id: validation.data.id,
      user_id,
    };

    // 5. Call service
    const snippet = await SnippetService.getSnippetById(command, access_token);

    // 6. Handle not found
    if (!snippet) {
      return errorResponse(
        404,
        'NOT_FOUND',
        'Snippet not found'
      );
    }

    // 7. Return success response
    return new Response(JSON.stringify(snippet), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    // Handle authentication errors (thrown by requireAuth)
    if (error instanceof Response) {
      return error;
    }

    // Handle database errors
    if (error.code) {
      return handleDatabaseError(error);
    }

    // Handle unexpected errors
    return handleUnexpectedError(error);
  }
};
