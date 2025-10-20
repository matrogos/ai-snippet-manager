import { z } from 'zod';
import { SUPPORTED_LANGUAGES, VALIDATION_RULES } from '@/constants/snippet.constants';
import type { SuggestTagsRequestDTO, ExplainCodeRequestDTO } from '@/types/ai.dto';

/**
 * Zod schema for validating POST /api/ai/suggest-tags request body
 */
export const suggestTagsSchema = z.object({
  code: z
    .string({ required_error: 'Code is required' })
    .min(1, { message: 'Code must not be empty' })
    .max(VALIDATION_RULES.CODE_MAX_LENGTH, {
      message: `Code exceeds maximum length of ${VALIDATION_RULES.CODE_MAX_LENGTH} characters`,
    }),

  language: z.enum(
    SUPPORTED_LANGUAGES as [string, ...string[]],
    {
      errorMap: (issue, ctx) => {
        if (issue.code === 'invalid_type') {
          return { message: 'Language is required' };
        }
        return { message: `Unsupported language. Must be one of: ${SUPPORTED_LANGUAGES.join(', ')}` };
      },
    }
  ),
});

/**
 * Validate and parse suggest tags request body
 */
export function validateSuggestTags(
  body: unknown
): { success: true; data: SuggestTagsRequestDTO } | { success: false; error: z.ZodError } {
  try {
    const result = suggestTagsSchema.parse(body);
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
 * Zod schema for validating POST /api/ai/explain-code request body
 */
export const explainCodeSchema = z.object({
  code: z
    .string({ required_error: 'Code is required' })
    .min(1, { message: 'Code must not be empty' })
    .max(VALIDATION_RULES.CODE_MAX_LENGTH, {
      message: `Code exceeds maximum length of ${VALIDATION_RULES.CODE_MAX_LENGTH} characters`,
    }),

  language: z.enum(
    SUPPORTED_LANGUAGES as [string, ...string[]],
    {
      errorMap: (issue, ctx) => {
        if (issue.code === 'invalid_type') {
          return { message: 'Language is required' };
        }
        return { message: `Unsupported language. Must be one of: ${SUPPORTED_LANGUAGES.join(', ')}` };
      },
    }
  ),
});

/**
 * Validate and parse explain code request body
 */
export function validateExplainCode(
  body: unknown
): { success: true; data: ExplainCodeRequestDTO } | { success: false; error: z.ZodError } {
  try {
    const result = explainCodeSchema.parse(body);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error };
    }
    throw error;
  }
}
