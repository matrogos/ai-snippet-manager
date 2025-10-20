import { z } from 'zod';
import {
  SUPPORTED_LANGUAGES,
  VALIDATION_RULES,
  ALLOWED_SORT_FIELDS,
  ALLOWED_SORT_ORDERS,
  DEFAULT_QUERY_PARAMS,
} from '@/constants/snippet.constants';
import type { SnippetListQueryDTO, SnippetIdParamDTO, UpdateSnippetRequestDTO } from '@/types/snippet.dto';

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

/**
 * Zod schema for validating snippet ID parameter (UUID format)
 */
export const snippetIdParamSchema = z.object({
  id: z.string().uuid({
    message: 'Invalid snippet ID format. Must be a valid UUID.',
  }),
});

/**
 * Validate and parse snippet ID parameter
 */
export function validateSnippetId(
  id: string
): { success: true; data: SnippetIdParamDTO } | { success: false; error: z.ZodError } {
  try {
    const result = snippetIdParamSchema.parse({ id });
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error };
    }
    throw error;
  }
}

/**
 * Zod schema for validating PUT /api/snippets/{id} request body (partial update)
 */
export const updateSnippetSchema = z
  .object({
    title: z
      .string()
      .min(1, { message: 'Title must not be empty' })
      .max(VALIDATION_RULES.TITLE_MAX_LENGTH, {
        message: `Title exceeds maximum length of ${VALIDATION_RULES.TITLE_MAX_LENGTH} characters`,
      })
      .transform((s) => s.trim())
      .optional(),

    code: z
      .string()
      .min(1, { message: 'Code must not be empty' })
      .max(VALIDATION_RULES.CODE_MAX_LENGTH, {
        message: `Code exceeds maximum length of ${VALIDATION_RULES.CODE_MAX_LENGTH} characters`,
      })
      .transform((s) => s.trim())
      .optional(),

    language: z
      .enum(
        SUPPORTED_LANGUAGES as [string, ...string[]],
        {
          errorMap: () => ({
            message: `Unsupported language. Must be one of: ${SUPPORTED_LANGUAGES.join(', ')}`,
          }),
        }
      )
      .optional(),

    description: z.string().nullable().optional(),

    tags: z
      .array(
        z
          .string()
          .min(VALIDATION_RULES.TAG_MIN_LENGTH, {
            message: `Each tag must be at least ${VALIDATION_RULES.TAG_MIN_LENGTH} characters`,
          })
          .max(VALIDATION_RULES.TAG_MAX_LENGTH, {
            message: `Each tag must not exceed ${VALIDATION_RULES.TAG_MAX_LENGTH} characters`,
          })
      )
      .max(VALIDATION_RULES.TAGS_MAX_COUNT, {
        message: `Maximum ${VALIDATION_RULES.TAGS_MAX_COUNT} tags allowed`,
      })
      .optional(),

    ai_description: z.string().nullable().optional(),

    ai_explanation: z.string().nullable().optional(),

    is_favorite: z.boolean({
      errorMap: () => ({ message: 'is_favorite must be a boolean' }),
    }).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

/**
 * Validate and parse update snippet request body
 */
export function validateUpdateSnippet(
  body: unknown
): { success: true; data: UpdateSnippetRequestDTO } | { success: false; error: z.ZodError } {
  try {
    const result = updateSnippetSchema.parse(body);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error };
    }
    throw error;
  }
}
