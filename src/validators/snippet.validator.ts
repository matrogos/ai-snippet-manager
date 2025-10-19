import { z } from 'zod';
import {
  SUPPORTED_LANGUAGES,
  VALIDATION_RULES,
  ALLOWED_SORT_FIELDS,
  ALLOWED_SORT_ORDERS,
  DEFAULT_QUERY_PARAMS,
} from '@/constants/snippet.constants';
import type { SnippetListQueryDTO } from '@/types/snippet.dto';

/**
 * Zod schema for validating GET /api/snippets query parameters
 */
export const snippetListQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : DEFAULT_QUERY_PARAMS.page))
    .pipe(
      z.number().int().min(VALIDATION_RULES.PAGE_MIN, {
        message: 'Page must be a positive integer',
      })
    ),

  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : DEFAULT_QUERY_PARAMS.limit))
    .pipe(
      z
        .number()
        .int()
        .min(VALIDATION_RULES.LIMIT_MIN, {
          message: `Limit must be at least ${VALIDATION_RULES.LIMIT_MIN}`,
        })
        .max(VALIDATION_RULES.LIMIT_MAX, {
          message: `Limit must not exceed ${VALIDATION_RULES.LIMIT_MAX}`,
        })
    ),

  sort: z
    .enum(['created_at', 'updated_at', 'title'])
    .optional()
    .default(DEFAULT_QUERY_PARAMS.sort),

  order: z
    .enum(['asc', 'desc'])
    .optional()
    .default(DEFAULT_QUERY_PARAMS.order),

  language: z
    .enum(['javascript', 'typescript', 'python', 'java', 'csharp', 'cpp', 'go', 'rust', 'php', 'ruby', 'sql', 'html', 'css'])
    .optional(),

  tags: z.string().optional(), // Comma-separated string, will be split in service layer

  search: z.string().optional(),
});

/**
 * Validate and parse snippet list query parameters
 */
export function validateSnippetListQuery(
  query: Record<string, string | undefined>
): { success: true; data: SnippetListQueryDTO } | { success: false; error: z.ZodError } {
  try {
    const result = snippetListQuerySchema.parse(query);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error };
    }
    throw error;
  }
}

/**
 * Format Zod validation errors for API response
 */
export function formatValidationErrors(error: z.ZodError): {
  errors: Array<{ field: string; message: string }>;
} {
  return {
    errors: error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    })),
  };
}
