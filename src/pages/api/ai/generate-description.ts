import type { APIRoute } from 'astro';
import { requireAuth } from '@/middleware/auth.middleware';
import { validateGenerateDescription, formatValidationErrors } from '@/validators/ai.validator';
import { callOpenAIWithRetry, generateDescription } from '@/lib/openai';
import { errorResponse, handleUnexpectedError } from '@/utils/error-handler';
import type { GenerateDescriptionCommand } from '@/types/ai.dto';

/**
 * POST /api/ai/generate-description
 * Generate concise 1-2 sentence description of code using OpenAI
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

    // 3. Validate generate description data
    const validation = validateGenerateDescription(body);

    if (!validation.success) {
      return errorResponse(
        400,
        'VALIDATION_ERROR',
        'Validation failed',
        formatValidationErrors(validation.error)
      );
    }

    // 4. Build service command
    const command: GenerateDescriptionCommand = {
      code: validation.data.code,
      language: validation.data.language,
      user_id, // For rate limiting tracking
    };

    // 5. Call OpenAI service with retry logic
    const description = await callOpenAIWithRetry(
      () => generateDescription(command.code, command.language)
    );

    // 6. Return success response
    return new Response(
      JSON.stringify({ description }),
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
        'Failed to generate description. Please try again.'
      );
    }

    // Handle unexpected errors
    return handleUnexpectedError(error);
  }
};
