// Snippet validation and configuration constants

import { SUPPORTED_LANGUAGES } from '@/config/languages';

/**
 * Re-export supported languages for validators
 */
export { SUPPORTED_LANGUAGES };

/**
 * Validation rules for snippet fields
 */
export const VALIDATION_RULES = {
  TITLE_MAX_LENGTH: 255,
  CODE_MAX_LENGTH: 50000,
  LANGUAGE_MAX_LENGTH: 50,
  TAG_MIN_LENGTH: 2,
  TAG_MAX_LENGTH: 30,
  TAG_MAX_COUNT: 20,
  PAGE_MIN: 1,
  LIMIT_MIN: 1,
  LIMIT_MAX: 100,
  LIMIT_DEFAULT: 20,
} as const;

/**
 * Allowed sort fields for snippet queries
 */
export const ALLOWED_SORT_FIELDS = ['created_at', 'updated_at', 'title'] as const;

/**
 * Allowed sort orders
 */
export const ALLOWED_SORT_ORDERS = ['asc', 'desc'] as const;

/**
 * Default query parameters
 */
export const DEFAULT_QUERY_PARAMS = {
  page: 1,
  limit: VALIDATION_RULES.LIMIT_DEFAULT,
  sort: 'created_at',
  order: 'desc',
} as const;
