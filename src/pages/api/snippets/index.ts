import type { APIRoute } from 'astro';
import { requireAuth } from '@/middleware/auth.middleware';
import { validateSnippetListQuery, formatValidationErrors } from '@/validators/snippet.validator';
import { SnippetService } from '@/services/snippet.service';
import { errorResponse, handleDatabaseError, handleUnexpectedError } from '@/utils/error-handler';
import type { GetSnippetsCommand } from '@/types/snippet.dto';

/**
 * GET /api/snippets
 * Retrieve paginated, filtered, and sorted list of snippets for authenticated user
 */
export const GET: APIRoute = async (context) => {
  try {
    // 1. Authenticate user
    const { user_id, access_token } = await requireAuth(context);

    // 2. Extract query parameters
    const url = new URL(context.request.url);
    const queryParams: Record<string, string | undefined> = {
      page: url.searchParams.get('page') || undefined,
      limit: url.searchParams.get('limit') || undefined,
      sort: url.searchParams.get('sort') || undefined,
      order: url.searchParams.get('order') || undefined,
      language: url.searchParams.get('language') || undefined,
      tags: url.searchParams.get('tags') || undefined,
      search: url.searchParams.get('search') || undefined,
    };

    // 3. Validate query parameters
    const validation = validateSnippetListQuery(queryParams);

    if (!validation.success) {
      return errorResponse(
        400,
        'VALIDATION_ERROR',
        'Invalid query parameters',
        formatValidationErrors(validation.error)
      );
    }

    const validatedParams = validation.data;

    // 4. Build service command
    const command: GetSnippetsCommand = {
      user_id,
      page: validatedParams.page!,
      limit: validatedParams.limit!,
      sort: validatedParams.sort!,
      order: validatedParams.order!,
      language: validatedParams.language,
      tags: validatedParams.tags ? validatedParams.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
      search: validatedParams.search,
    };

    // 5. Call service with authenticated token
    const result = await SnippetService.getSnippets(command, access_token);

    // 6. Return success response
    return new Response(JSON.stringify(result), {
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
