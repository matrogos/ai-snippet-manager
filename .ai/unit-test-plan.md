# Unit Testing Plan for AI Snippet Manager

**Document Version:** 1.0
**Last Updated:** 2025-01-20
**Status:** Ready for Implementation

---

## Overview

This document provides a comprehensive plan for implementing unit tests in the AI Snippet Manager project. It includes tool recommendations, test candidates with priorities, and implementation guidelines for agents or developers to follow.

---

## Testing Tools & Framework Recommendations

### Recommended Stack

**Primary Testing Framework:**
- **Vitest** - Fast, modern test runner designed for Vite-based projects
  - Why: Native ESM support, compatible with Astro, faster than Jest
  - Alternative: Jest (if Vitest setup is problematic)

**Assertion Library:**
- **Vitest built-in assertions** (Jest-compatible API)
  - `expect()`, `toBe()`, `toEqual()`, `toThrow()`, etc.

**React Component Testing:**
- **React Testing Library** (@testing-library/react)
  - Why: Tests behavior, not implementation details
  - Use for: Form components, interactive UI logic

**Type Checking:**
- **TypeScript** (already in project)
  - Provides compile-time type safety

### Installation Command

```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

### Configuration File

Create `vitest.config.ts` in project root:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Test Setup File

Create `src/__tests__/setup.ts`:

```typescript
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});
```

### Package.json Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:run": "vitest run"
  }
}
```

---

## Test Candidates by Priority

### 🔴 Priority 0: Critical Business Logic (Implement First)

These are pure functions with clear inputs/outputs that are critical for data integrity and security.

#### 1. Snippet Validator (`src/validators/snippet.validator.ts`)

**File:** `src/__tests__/validators/snippet.validator.test.ts`

**Functions to Test:**
- `validateSnippetListQuery()`
- `validateSnippetId()`
- `validateCreateSnippet()`
- `validateUpdateSnippet()`
- `formatValidationErrors()`

**Why Priority 0:**
- Prevents invalid data from reaching database
- Security-critical (prevents injection, malformed data)
- Used in every API endpoint
- Pure functions (no dependencies)
- High test ROI - bugs here affect entire system

**Test Cases:**

```typescript
describe('validateSnippetListQuery', () => {
  // Valid inputs
  test('accepts valid query parameters');
  test('applies default values for missing params');
  test('parses string numbers to integers (page, limit)');

  // Validation rules
  test('rejects page < 1');
  test('rejects limit < 1');
  test('rejects limit > 100');
  test('rejects invalid sort fields');
  test('rejects invalid order values');
  test('accepts valid language codes');
  test('rejects invalid language codes');
  test('accepts comma-separated tags string');
  test('accepts search query string');

  // Edge cases
  test('handles empty query object');
  test('handles undefined values');
  test('handles null values');
});

describe('validateSnippetId', () => {
  test('accepts valid UUID v4');
  test('rejects non-UUID strings');
  test('rejects empty string');
  test('rejects numeric IDs');
  test('rejects UUID with wrong version');
});

describe('validateCreateSnippet', () => {
  // Valid inputs
  test('accepts valid snippet data');
  test('trims whitespace from title and code');
  test('accepts optional description');
  test('accepts optional tags array');
  test('accepts empty tags array');

  // Title validation
  test('rejects empty title');
  test('rejects title > 255 characters');
  test('requires title field');

  // Code validation
  test('rejects empty code');
  test('rejects code > 50000 characters');
  test('requires code field');

  // Language validation
  test('accepts all supported languages');
  test('rejects unsupported language');
  test('requires language field');

  // Tags validation
  test('rejects tags > 10 count');
  test('rejects tag < 1 character');
  test('rejects tag > 50 characters');
  test('accepts valid tags array');

  // Optional fields
  test('accepts null description');
  test('accepts null ai_description');
  test('accepts null ai_explanation');
});

describe('validateUpdateSnippet', () => {
  test('accepts partial updates (any single field)');
  test('rejects empty update object');
  test('allows optional title update');
  test('allows optional code update');
  test('allows optional language update');
  test('allows optional tags update');
  test('allows optional is_favorite update');
  test('validates is_favorite as boolean');
  test('applies same validation rules as create');
});

describe('formatValidationErrors', () => {
  test('formats Zod errors into API response shape');
  test('includes field path and message');
  test('handles nested field paths');
  test('handles multiple errors');
});
```

**Estimated Effort:** 4-6 hours

---

#### 2. AI Request Validator (`src/validators/ai.validator.ts`)

**File:** `src/__tests__/validators/ai.validator.test.ts`

**Functions to Test:**
- `validateSuggestTags()`
- `validateExplainCode()`
- `validateGenerateDescription()`
- `formatValidationErrors()` (shared)

**Why Priority 0:**
- Prevents abuse of AI endpoints (expensive API calls)
- Rate limiting depends on valid input
- Protects against excessively large code submissions

**Test Cases:**

```typescript
describe('validateSuggestTags', () => {
  test('accepts valid code and language');
  test('rejects empty code');
  test('rejects code > 50000 characters');
  test('requires code field');
  test('requires language field');
  test('accepts all supported languages');
  test('rejects unsupported language');
});

describe('validateExplainCode', () => {
  // Same test structure as validateSuggestTags
  test('accepts valid code and language');
  test('rejects empty code');
  test('rejects code > 50000 characters');
  test('requires code field');
  test('requires language field');
  test('accepts all supported languages');
  test('rejects unsupported language');
});

describe('validateGenerateDescription', () => {
  // Same test structure as validateSuggestTags
  test('accepts valid code and language');
  test('rejects empty code');
  test('rejects code > 50000 characters');
  test('requires code field');
  test('requires language field');
  test('accepts all supported languages');
  test('rejects unsupported language');
});
```

**Estimated Effort:** 2-3 hours

---

#### 3. Utility Functions - Validation (`src/lib/utils.ts`)

**File:** `src/__tests__/lib/utils.test.ts`

**Functions to Test:**
- `sanitizeInput()`
- `validateSnippetInput()`
- `isValidEmail()`
- `isValidPassword()`
- `formatDate()`
- `getRelativeTime()`

**Why Priority 0:**
- Used throughout the application
- Security-critical (XSS prevention via sanitizeInput)
- User-facing (date formatting bugs are immediately visible)
- Pure functions (easy to test)

**Test Cases:**

```typescript
describe('sanitizeInput', () => {
  test('removes script tags');
  test('removes script tags with attributes');
  test('removes multiple script tags');
  test('removes script tags case-insensitively');
  test('trims whitespace');
  test('preserves other HTML tags (for now)');
  test('handles empty string');
  test('handles string without script tags');
});

describe('validateSnippetInput', () => {
  test('returns valid:true for valid input');
  test('returns valid:false with errors for invalid input');
  test('checks title is required');
  test('checks title length <= 255');
  test('checks code is required');
  test('checks code length <= 50000');
  test('checks language is supported');
  test('returns multiple errors for multiple issues');
});

describe('isValidEmail', () => {
  // Valid emails
  test('accepts standard email');
  test('accepts email with plus sign');
  test('accepts email with dots in local part');
  test('accepts email with subdomain');
  test('accepts email with numbers');

  // Invalid emails
  test('rejects email without @');
  test('rejects email without domain');
  test('rejects email without TLD');
  test('rejects email with spaces');
  test('rejects empty string');
});

describe('isValidPassword', () => {
  test('accepts password with 8 characters');
  test('accepts password with > 8 characters');
  test('rejects password with < 8 characters');
  test('rejects empty password');
});

describe('formatDate', () => {
  test('formats ISO date string correctly');
  test('formats date as "Jan 15, 2025" format');
  test('handles different timezones');
  test('handles invalid date string gracefully');
});

describe('getRelativeTime', () => {
  // Boundary testing for time ranges
  test('returns "just now" for < 1 minute ago');
  test('returns "1 minute ago" for exactly 1 minute');
  test('returns "5 minutes ago" for 5 minutes');
  test('returns "59 minutes ago" for 59 minutes');
  test('returns "1 hour ago" for exactly 60 minutes');
  test('returns "2 hours ago" for 2 hours');
  test('returns "23 hours ago" for 23 hours');
  test('returns "1 day ago" for exactly 24 hours');
  test('returns "3 days ago" for 3 days');
  test('returns "6 days ago" for 6 days');
  test('returns formatted date for >= 7 days');

  // Singular/plural testing
  test('uses singular "minute" for 1 minute');
  test('uses plural "minutes" for > 1 minute');
  test('uses singular "hour" for 1 hour');
  test('uses plural "hours" for > 1 hour');
  test('uses singular "day" for 1 day');
  test('uses plural "days" for > 1 day');
});
```

**Estimated Effort:** 3-4 hours

---

#### 4. Error Handler (`src/utils/error-handler.ts`)

**File:** `src/__tests__/utils/error-handler.test.ts`

**Functions to Test:**
- `createErrorResponse()`
- `errorResponse()`
- `handleDatabaseError()`
- `handleUnexpectedError()`
- `logError()` (optional - requires mock)

**Why Priority 0:**
- Critical for consistent error handling across API
- User experience depends on clear error messages
- Debugging depends on proper error logging
- Security: prevents leaking sensitive error details

**Test Cases:**

```typescript
describe('createErrorResponse', () => {
  test('creates error response with code and message');
  test('includes details when provided');
  test('omits details when not provided');
  test('uses correct ERROR_CODES constant');
  test('creates response for all error code types');
});

describe('errorResponse', () => {
  test('returns Response object with correct status');
  test('returns Response with correct Content-Type header');
  test('returns Response with JSON body');
  test('includes error code in response body');
  test('includes error message in response body');
  test('includes details in response body when provided');
});

describe('handleDatabaseError', () => {
  test('handles PostgreSQL duplicate entry error (23505)');
  test('handles PostgreSQL foreign key violation (23503)');
  test('handles generic database errors');
  test('returns 400 status for validation errors');
  test('returns 500 status for generic errors');
  test('calls logError internally');
});

describe('handleUnexpectedError', () => {
  test('handles Error objects');
  test('handles unknown error types');
  test('returns 500 status code');
  test('returns INTERNAL_ERROR code');
  test('returns generic error message');
  test('does not leak error details to client');
  test('calls logError internally');
});

describe('logError', () => {
  // Note: Requires mocking console.error
  test('logs error message');
  test('logs error stack trace');
  test('logs context data');
  test('logs timestamp');
  test('handles Error objects');
  test('handles non-Error objects');
});
```

**Estimated Effort:** 3-4 hours

---

### 🟡 Priority 1: API Client & Helper Functions

These functions have complex logic and edge cases but are less critical than validators.

#### 5. API Client Query Builder (`src/lib/api-client.ts`)

**File:** `src/__tests__/lib/api-client.test.ts`

**Functions to Test:**
- `buildQueryString()`

**Why Priority 1:**
- Complex string manipulation
- Edge cases with undefined/null values
- Used in all API calls
- Bugs cause API request failures

**Test Cases:**

```typescript
describe('buildQueryString', () => {
  test('returns empty string for empty params');
  test('formats single param correctly');
  test('formats multiple params with & separator');
  test('starts with ? when params exist');
  test('omits undefined values');
  test('omits fields when value is undefined');
  test('includes page parameter');
  test('includes limit parameter');
  test('includes sort parameter');
  test('includes order parameter');
  test('includes language parameter');
  test('includes tags parameter');
  test('includes search parameter');
  test('handles all params together');
  test('URL encodes special characters');
  test('converts numbers to strings');
});
```

**Note:** Do NOT test `getAuthHeaders()`, `fetchSnippets()`, `createSnippet()`, etc. - these require mocking Supabase and are better suited for integration tests.

**Estimated Effort:** 1-2 hours

---

### 🟢 Priority 2: Optional (Future Improvements)

These are lower priority but still provide value.

#### 6. Form Helper Functions

**File:** `src/__tests__/components/snippet-form-helpers.test.ts`

**Functions to Test:**
- Tag parsing logic (comma-separated string → array)
- Form dirty state detection
- AI loading state management

**Why Priority 2:**
- Currently embedded in React components
- Should be extracted to pure functions first
- Then unit tested

**Recommended Refactor:**

```typescript
// src/lib/form-helpers.ts (NEW FILE)

/**
 * Parse comma-separated tags string into array
 */
export function parseTagsInput(input: string): string[] {
  return input
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean);
}

/**
 * Check if form has unsaved changes
 */
export function hasUnsavedChanges(
  initial: Record<string, any>,
  current: Record<string, any>,
  fieldsToCheck: string[]
): boolean {
  return fieldsToCheck.some(field => initial[field] !== current[field]);
}
```

**Test Cases:**

```typescript
describe('parseTagsInput', () => {
  test('parses comma-separated tags');
  test('trims whitespace from each tag');
  test('filters out empty strings');
  test('handles single tag');
  test('handles empty string');
  test('handles tags with extra commas');
  test('handles tags with spaces around commas');
});

describe('hasUnsavedChanges', () => {
  test('returns false when no changes');
  test('returns true when field changed');
  test('returns true when multiple fields changed');
  test('only checks specified fields');
  test('handles undefined values');
  test('handles null values');
});
```

**Estimated Effort:** 2-3 hours (including refactor)

---

#### 7. Constants Validation

**File:** `src/__tests__/constants/snippet.constants.test.ts`

**Why Priority 2:**
- Ensures constants are correctly defined
- Catches typos and misconfigurations
- Quick to implement

**Test Cases:**

```typescript
describe('SUPPORTED_LANGUAGES', () => {
  test('contains expected languages');
  test('all languages have corresponding LANGUAGE_LABELS');
  test('no duplicate languages');
});

describe('VALIDATION_RULES', () => {
  test('TITLE_MAX_LENGTH is 255');
  test('CODE_MAX_LENGTH is 50000');
  test('TAG_MIN_LENGTH is 1');
  test('TAG_MAX_LENGTH is 50');
  test('TAGS_MAX_COUNT is 10');
  test('PAGE_MIN is 1');
  test('LIMIT_MIN is 1');
  test('LIMIT_MAX is 100');
});

describe('DEFAULT_QUERY_PARAMS', () => {
  test('default page is 1');
  test('default limit is 20');
  test('default sort is created_at');
  test('default order is desc');
});
```

**Estimated Effort:** 1 hour

---

## ❌ Not Recommended for Unit Testing

These components should use **integration tests** or **E2E tests** instead:

### React Components
- `SnippetForm.tsx`
- `SnippetList.tsx`
- `SnippetCard.tsx`
- `LoginForm.tsx`
- `RegisterForm.tsx`

**Why:** Require React Testing Library + complex setup, better tested as integrated components.

### API Route Handlers
- `src/pages/api/snippets/index.ts`
- `src/pages/api/snippets/[id].ts`
- `src/pages/api/ai/*.ts`

**Why:** Require mocking Astro context, Supabase, OpenAI - integration tests provide better coverage.

### Service Layer
- `SnippetService.getSnippets()`
- `SnippetService.createSnippet()`
- etc.

**Why:** These are thin wrappers around Supabase queries - require database mocking, better as integration tests.

### External Integrations
- `src/lib/supabase.ts`
- `src/lib/openai.ts`

**Why:** Testing implementation details of SDK initialization provides little value.

---

## Implementation Order

**Week 1: Setup + Critical Validators**
1. Install Vitest and testing dependencies
2. Configure `vitest.config.ts`
3. Create test setup file
4. Write tests for `snippet.validator.ts` (Priority 0)
5. Write tests for `ai.validator.ts` (Priority 0)

**Week 2: Utilities + Error Handling**
6. Write tests for `utils.ts` (Priority 0)
7. Write tests for `error-handler.ts` (Priority 0)

**Week 3: API Client + Polish**
8. Write tests for `api-client.ts` query builder (Priority 1)
9. Refactor form helpers into pure functions (Priority 2)
10. Write tests for form helpers (Priority 2)

**Week 4: Coverage + CI/CD**
11. Add constants validation tests (Priority 2)
12. Set up coverage reporting
13. Add tests to CI/CD pipeline
14. Set coverage thresholds (aim for 80%+ on tested files)

---

## Coverage Goals

**Target Coverage by File:**
- Validators: **95%+** (critical path)
- Utilities: **90%+** (high usage)
- Error handlers: **85%+** (many edge cases)
- API client helpers: **80%+** (mostly happy path)

**Overall Target:** 85%+ coverage on unit-tested files

**Note:** Coverage should focus on **tested files only**. Don't aim for 100% codebase coverage - focus on high-value pure functions.

---

## Test Quality Guidelines

### Good Tests
✅ Test behavior, not implementation
✅ Use descriptive test names
✅ One assertion per test (when possible)
✅ Test edge cases and boundaries
✅ Test error conditions
✅ Keep tests DRY with helpers/fixtures

### Bad Tests
❌ Testing TypeScript types (use `tsc` instead)
❌ Testing third-party library behavior
❌ Over-mocking (mock only external dependencies)
❌ Testing trivial code (getters/setters)
❌ Brittle tests that break on refactors

---

## Running Tests

```bash
# Run all tests (watch mode)
npm test

# Run tests once (CI mode)
npm run test:run

# Run with UI
npm run test:ui

# Run with coverage report
npm run test:coverage

# Run specific test file
npm test src/__tests__/validators/snippet.validator.test.ts

# Run tests matching pattern
npm test -- snippet
```

---

## Example Test File Structure

```typescript
// src/__tests__/validators/snippet.validator.test.ts
import { describe, test, expect } from 'vitest';
import { validateSnippetId, validateCreateSnippet } from '@/validators/snippet.validator';

describe('snippet.validator', () => {

  describe('validateSnippetId', () => {
    test('accepts valid UUID v4', () => {
      const result = validateSnippetId('550e8400-e29b-41d4-a716-446655440000');
      expect(result.success).toBe(true);
    });

    test('rejects non-UUID strings', () => {
      const result = validateSnippetId('not-a-uuid');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('UUID');
      }
    });

    test('rejects empty string', () => {
      const result = validateSnippetId('');
      expect(result.success).toBe(false);
    });
  });

  describe('validateCreateSnippet', () => {
    test('accepts valid snippet data', () => {
      const validData = {
        title: 'Test Snippet',
        code: 'console.log("hello");',
        language: 'javascript',
        description: 'A test snippet',
        tags: ['test', 'javascript'],
      };

      const result = validateCreateSnippet(validData);
      expect(result.success).toBe(true);
    });

    test('rejects empty title', () => {
      const invalidData = {
        title: '',
        code: 'console.log("hello");',
        language: 'javascript',
      };

      const result = validateCreateSnippet(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('empty');
      }
    });

    test('rejects title > 255 characters', () => {
      const invalidData = {
        title: 'a'.repeat(256),
        code: 'console.log("hello");',
        language: 'javascript',
      };

      const result = validateCreateSnippet(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('255');
      }
    });

    test('rejects tags > 10 count', () => {
      const invalidData = {
        title: 'Test',
        code: 'console.log("hello");',
        language: 'javascript',
        tags: Array(11).fill('tag'),
      };

      const result = validateCreateSnippet(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('10');
      }
    });
  });
});
```

---

## Summary

**Total Estimated Effort:** 16-22 hours

**Priority Breakdown:**
- 🔴 Priority 0 (Critical): 12-17 hours → **Implement first**
- 🟡 Priority 1 (High): 1-2 hours → **Implement second**
- 🟢 Priority 2 (Optional): 3-4 hours → **Implement if time allows**

**Expected Outcomes:**
- 85%+ coverage on critical business logic
- Prevention of regression bugs
- Faster debugging with clear test failures
- Documentation through test cases
- Confidence in refactoring

**Next Steps for Implementation Agent:**
1. Read this document completely
2. Install testing dependencies
3. Set up Vitest configuration
4. Start with Priority 0, Test Candidate #1 (snippet.validator.ts)
5. Follow test case structure provided
6. Run tests frequently to ensure they pass
7. Proceed sequentially through priorities

---

**Document End**
