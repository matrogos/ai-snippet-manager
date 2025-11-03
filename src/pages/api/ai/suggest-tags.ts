import type { APIRoute } from 'astro';
import { requireAuth } from '@/middleware/auth.middleware';
import { validateSuggestTags, formatValidationErrors } from '@/validators/ai.validator';
import { callOpenAIWithRetry, suggestTags } from '@/lib/openai';
import { errorResponse, handleUnexpectedError } from '@/utils/error-handler';
import type { SuggestTagsCommand } from '@/types/ai.dto';

/**
 * POST /api/ai/suggest-tags
 * Generate 3-5 relevant tags for code snippets using OpenAI
 */
export const POST: APIRoute = async (context) => {
  try {
    // 1. Authenticate user
    const { user_id } = await requireAuth(context);

    // 2. Parse and validate request body
    let body;
    try {
      body = await context.request.json();
    } catch (e) {
      return errorResponse(
        400,
        'VALIDATION_ERROR',
        'Invalid JSON format'
      );
    }

    // 3. Validate suggest tags data
    const validation = validateSuggestTags(body);

    if (!validation.success) {
      return errorResponse(
        400,
        'VALIDATION_ERROR',
        'Validation failed',
        formatValidationErrors(validation.error)
      );
    }

    // 4. Build service command
    const command: SuggestTagsCommand = {
      code: validation.data.code,
      language: validation.data.language,
      user_id, // For rate limiting tracking
    };

    // 5. Call OpenAI service with retry logic
    const tags = await callOpenAIWithRetry(
      () => suggestTags(command.code, command.language)
    );

    // 6. Return success response
    return new Response(
      JSON.stringify({ tags }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    // Handle authentication errors (thrown by requireAuth)
    if (error instanceof Response) {
      return error;
    }

    // Handle OpenAI API errors
    if (error.status) {
      return errorResponse(
        500,
        'AI_SERVICE_ERROR',
        'Failed to suggest tags. Please try again.'
      );
    }

    // Handle unexpected errors
    return handleUnexpectedError(error);
  }
};
