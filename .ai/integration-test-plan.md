# Integration Testing Plan for AI Snippet Manager

**Document Version:** 1.0
**Last Updated:** 2025-01-20
**Status:** Ready for Implementation

---

## Overview

This document provides a comprehensive plan for implementing integration tests in the AI Snippet Manager project. Integration tests verify that different parts of the application work together correctly, focusing on API endpoints, database interactions, authentication flows, and external service integrations.

**Key Difference from Unit Tests:**
- Unit tests: Test individual functions in isolation
- Integration tests: Test multiple components working together (API routes + validators + services + database)

---

## Testing Tools & Framework Recommendations

### Recommended Stack

**Primary Testing Framework:**
- **Vitest** (already installed) - For running integration tests
- **Supertest** or **Vitest's fetch mocking** - For HTTP request testing

**Database Strategy:**
- **Supabase Test Project** - Separate test database instance
- **Test Data Fixtures** - Predefined test data for consistent testing
- **Database Cleanup** - Reset state between tests

**Authentication Strategy:**
- **Test User Credentials** - Dedicated test user accounts
- **JWT Token Helpers** - Functions to generate valid test tokens
- **Mock Auth Middleware** (optional) - For faster tests without external auth

**External Service Mocking:**
- **Mock OpenAI API** - Use fixtures for AI responses (avoid costs)
- **Nock** or **MSW (Mock Service Worker)** - For HTTP mocking

### Installation Commands

```bash
# Core testing dependencies (already installed)
# vitest, @vitest/ui, jsdom

# Additional for integration tests
npm install -D supertest @types/supertest nock msw
```

### Configuration

Add to `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    // ... existing config

    // Integration test specific settings
    testTimeout: 30000, // Longer timeout for API calls
    hookTimeout: 30000, // Longer timeout for setup/teardown

    // Separate integration tests from unit tests
    include: ['src/__tests__/**/*.test.ts', 'src/__integration__/**/*.integration.test.ts'],
  },
});
```

### Test Environment Setup

Create `src/__integration__/setup.ts`:

```typescript
import { beforeAll, afterAll, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Test database configuration
export const testSupabase = createClient(
  process.env.TEST_SUPABASE_URL!,
  process.env.TEST_SUPABASE_ANON_KEY!
);

// Test user credentials
export const TEST_USER = {
  email: 'test@example.com',
  password: 'TestPassword123!',
  user_id: '', // Will be populated during setup
  access_token: '', // Will be populated during setup
};

// Setup: Run before all tests
beforeAll(async () => {
  // Create or authenticate test user
  // Populate TEST_USER.user_id and TEST_USER.access_token
});

// Teardown: Run after all tests
afterAll(async () => {
  // Clean up test data if needed
});

// Reset: Run after each test
afterEach(async () => {
  // Delete all test snippets created during tests
  await testSupabase
    .from('snippets')
    .delete()
    .eq('user_id', TEST_USER.user_id);
});
```

### Environment Variables

Create `.env.test`:

```env
# Test Database (Supabase test project)
TEST_SUPABASE_URL=https://your-test-project.supabase.co
TEST_SUPABASE_ANON_KEY=your-test-anon-key

# Test User
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=TestPassword123!

# OpenAI (use mock or test key with low limits)
OPENAI_API_KEY=sk-test-mock-key
```

---

## Integration Test Candidates by Priority

### 🔴 Priority 0: Critical API Endpoints (Implement First)

These endpoints handle core functionality and must work correctly with real database/auth.

#### 1. Snippet CRUD Endpoints

**File:** `src/__integration__/api/snippets.integration.test.ts`

**Endpoints to Test:**
- `GET /api/snippets` - List snippets with pagination/filtering
- `GET /api/snippets/{id}` - Get single snippet
- `POST /api/snippets` - Create snippet
- `PUT /api/snippets/{id}` - Update snippet

**Why Priority 0:**
- Core application functionality
- Involves authentication, validation, database, and service layer
- User-facing critical path
- Complex query building and filtering logic

**Test Scenarios:**

```typescript
describe('GET /api/snippets', () => {
  // Authentication tests
  test('returns 401 when not authenticated');
  test('returns 401 with invalid token');
  test('returns 401 with expired token');
  test('returns 401 with missing Authorization header');

  // Success cases
  test('returns empty array when user has no snippets');
  test('returns user snippets with default pagination (page 1, limit 20)');
  test('returns snippets sorted by created_at desc by default');
  test('returns only authenticated user snippets (not other users)');

  // Pagination
  test('returns correct page 1 of snippets');
  test('returns correct page 2 of snippets');
  test('respects custom limit parameter');
  test('returns correct pagination metadata (total, pages, current page)');
  test('rejects page < 1');
  test('rejects limit > 100');

  // Sorting
  test('sorts by created_at ascending');
  test('sorts by created_at descending');
  test('sorts by updated_at ascending');
  test('sorts by updated_at descending');
  test('sorts by title ascending (alphabetical)');
  test('sorts by title descending (reverse alphabetical)');

  // Filtering by language
  test('filters by javascript language');
  test('filters by python language');
  test('returns empty when filtering by language with no matches');

  // Filtering by tags
  test('filters by single tag');
  test('filters by multiple tags (comma-separated)');
  test('returns snippets matching any of the provided tags');

  // Search functionality
  test('searches in snippet title');
  test('searches in snippet description');
  test('searches in snippet code');
  test('searches in ai_description');
  test('search is case-insensitive');
  test('returns empty when search has no matches');

  // Combined filters
  test('combines language + tags filters');
  test('combines search + language filters');
  test('combines all filters + pagination + sorting');

  // Error cases
  test('returns 400 for invalid page parameter');
  test('returns 400 for invalid limit parameter');
  test('returns 400 for invalid sort field');
  test('returns 400 for invalid order value');
});

describe('GET /api/snippets/{id}', () => {
  // Authentication
  test('returns 401 when not authenticated');

  // Success cases
  test('returns snippet by valid ID for authenticated user');
  test('returns all snippet fields (title, code, language, etc.)');
  test('returns snippet with tags array');
  test('returns snippet with AI-generated fields');

  // Authorization
  test('returns 404 when snippet belongs to different user');
  test('returns 404 when snippet does not exist');

  // Validation
  test('returns 400 for invalid UUID format');
  test('returns 400 for empty ID');
});

describe('POST /api/snippets', () => {
  // Authentication
  test('returns 401 when not authenticated');

  // Success cases
  test('creates snippet with valid data');
  test('creates snippet and returns it with generated ID');
  test('creates snippet and returns it with timestamps');
  test('creates snippet with tags array');
  test('creates snippet with optional description');
  test('creates snippet with AI-generated description');
  test('creates snippet with AI-generated explanation');
  test('sets is_favorite to false by default');

  // Validation
  test('returns 400 when title is missing');
  test('returns 400 when title is empty');
  test('returns 400 when title exceeds 255 characters');
  test('returns 400 when code is missing');
  test('returns 400 when code is empty');
  test('returns 400 when code exceeds 50000 characters');
  test('returns 400 when language is missing');
  test('returns 400 when language is unsupported');
  test('returns 400 when tags exceed 20 count');
  test('returns 400 when tag is too short (< 2 chars)');
  test('returns 400 when tag is too long (> 30 chars)');

  // Database integration
  test('snippet is persisted in database');
  test('snippet is associated with authenticated user');
  test('created_at and updated_at are set automatically');
});

describe('PUT /api/snippets/{id}', () => {
  // Authentication
  test('returns 401 when not authenticated');

  // Success cases
  test('updates snippet title');
  test('updates snippet code');
  test('updates snippet language');
  test('updates snippet tags');
  test('updates snippet description');
  test('updates is_favorite flag');
  test('updates multiple fields at once');
  test('returns updated snippet');
  test('updates updated_at timestamp');

  // Partial updates
  test('allows updating only title');
  test('allows updating only code');
  test('allows updating only tags');

  // Authorization
  test('returns 404 when snippet belongs to different user');
  test('returns 404 when snippet does not exist');

  // Validation
  test('returns 400 when no fields provided for update');
  test('returns 400 when title exceeds 255 characters');
  test('returns 400 when code exceeds 50000 characters');
  test('returns 400 for invalid UUID format');
  test('returns 400 for unsupported language');
  test('returns 400 when tags exceed 20 count');

  // Database integration
  test('changes are persisted in database');
  test('updated_at is newer than created_at');
});
```

**Estimated Effort:** 10-12 hours

---

#### 2. Authentication Middleware

**File:** `src/__integration__/middleware/auth.integration.test.ts`

**Functions to Test:**
- `authenticate()` - Validates JWT token
- `requireAuth()` - Enforces authentication on routes

**Why Priority 0:**
- Security-critical component
- Used by every protected API route
- Involves Supabase auth service integration

**Test Scenarios:**

```typescript
describe('authenticate', () => {
  // Valid authentication
  test('accepts valid Bearer token');
  test('returns user_id for valid token');
  test('returns access_token for valid token');

  // Invalid/missing tokens
  test('rejects missing Authorization header');
  test('rejects invalid Bearer token format');
  test('rejects token without "Bearer " prefix');
  test('rejects empty token after "Bearer "');
  test('rejects expired token');
  test('rejects revoked token');
  test('rejects malformed JWT');

  // Supabase integration
  test('validates token with Supabase auth service');
  test('handles Supabase auth service errors gracefully');
});

describe('requireAuth', () => {
  test('returns user_id and access_token for authenticated request');
  test('throws 401 Response for unauthenticated request');
  test('throws Response with UNAUTHORIZED error code');
  test('throws Response with JSON error format');
});
```

**Estimated Effort:** 3-4 hours

---

### 🟡 Priority 1: AI Service Endpoints

#### 3. AI Feature Endpoints

**File:** `src/__integration__/api/ai.integration.test.ts`

**Endpoints to Test:**
- `POST /api/ai/suggest-tags` - AI tag suggestions
- `POST /api/ai/explain-code` - AI code explanation
- `POST /api/ai/generate-description` - AI description generation

**Why Priority 1:**
- External API dependency (OpenAI)
- Expensive operations (API costs)
- Should use mocked responses for most tests
- Real API test in separate smoke test suite

**Test Scenarios:**

```typescript
describe('POST /api/ai/suggest-tags (mocked OpenAI)', () => {
  // Authentication
  test('returns 401 when not authenticated');

  // Success cases (mocked)
  test('returns array of suggested tags');
  test('returns tags in lowercase');
  test('returns relevant tags for JavaScript code');
  test('returns relevant tags for Python code');
  test('limits to reasonable number of tags (< 10)');

  // Validation
  test('returns 400 when code is missing');
  test('returns 400 when code is empty');
  test('returns 400 when code exceeds 50000 characters');
  test('returns 400 when language is missing');
  test('returns 400 when language is unsupported');

  // Error handling
  test('returns 500 when OpenAI API fails');
  test('retries on transient OpenAI errors');
  test('handles OpenAI rate limiting gracefully');
  test('handles OpenAI timeout');
});

describe('POST /api/ai/explain-code (mocked OpenAI)', () => {
  // Similar structure to suggest-tags
  test('returns code explanation string');
  test('explanation is non-empty');
  test('handles different programming languages');

  // ... validation and error tests
});

describe('POST /api/ai/generate-description (mocked OpenAI)', () => {
  // Similar structure to suggest-tags
  test('returns 1-2 sentence description');
  test('description is concise and relevant');

  // ... validation and error tests
});
```

**Estimated Effort:** 6-8 hours

---

### 🟢 Priority 2: Service Layer Integration

#### 4. Snippet Service

**File:** `src/__integration__/services/snippet.service.integration.test.ts`

**Methods to Test:**
- `SnippetService.getSnippets()`
- `SnippetService.getSnippetById()`
- `SnippetService.createSnippet()`
- `SnippetService.updateSnippet()`

**Why Priority 2:**
- Lower priority since API tests already cover this indirectly
- Useful for testing complex database queries in isolation
- Good for performance testing

**Test Scenarios:**

```typescript
describe('SnippetService.getSnippets', () => {
  // Database queries
  test('queries snippets table with user_id filter');
  test('applies language filter correctly');
  test('applies tags filter with overlaps (array matching)');
  test('applies full-text search on title, description, ai_description');
  test('sorts by created_at, updated_at, or title');
  test('applies pagination with range');

  // Performance
  test('executes query in < 500ms for 1000 snippets');
  test('uses database indexes efficiently');

  // Edge cases
  test('returns empty array for user with no snippets');
  test('handles special characters in search query');
  test('handles pagination beyond last page');
});

describe('SnippetService.createSnippet', () => {
  // Database insertion
  test('inserts snippet into database');
  test('auto-generates UUID for id');
  test('auto-generates timestamps');
  test('sets default is_favorite to false');

  // Data integrity
  test('stores tags as JSON array');
  test('stores code with special characters');
  test('enforces user_id foreign key constraint');
});
```

**Estimated Effort:** 4-6 hours

---

### 🟢 Priority 2: API Client Integration

#### 5. Frontend API Client

**File:** `src/__integration__/lib/api-client.integration.test.ts`

**Functions to Test:**
- `fetchSnippets()` - Fetch with query params
- `fetchSnippetById()` - Fetch single snippet
- `createSnippet()` - Create via API
- `updateSnippet()` - Update via API
- `suggestTags()` - AI tags
- `explainCode()` - AI explanation
- `generateDescriptionAPI()` - AI description

**Why Priority 2:**
- Frontend integration with backend API
- Tests end-to-end flow from client to server
- Requires running development server

**Test Scenarios:**

```typescript
describe('fetchSnippets', () => {
  // Integration with backend
  test('fetches snippets from GET /api/snippets');
  test('includes Authorization header with JWT');
  test('builds query string correctly');
  test('parses JSON response');
  test('returns PaginatedSnippetsResponseDTO');

  // Error handling
  test('throws error when not authenticated');
  test('throws error with message from API');
  test('handles network errors');
  test('handles 500 server errors');
});

describe('createSnippet', () => {
  test('sends POST request to /api/snippets');
  test('includes snippet data in request body');
  test('includes Authorization header');
  test('returns created snippet with ID');
  test('throws error for validation failures');
});
```

**Estimated Effort:** 3-4 hours

---

### 🔵 Priority 3: End-to-End Scenarios

#### 6. Complete User Workflows

**File:** `src/__integration__/scenarios/user-workflows.integration.test.ts`

**Scenarios to Test:**
- Complete snippet lifecycle (create → read → update → delete)
- Search and filter workflow
- AI feature usage workflow

**Why Priority 3:**
- Most comprehensive but slowest tests
- Better suited for E2E tests with Playwright
- Can be deferred if E2E tests exist

**Test Scenarios:**

```typescript
describe('Complete snippet lifecycle', () => {
  test('user creates snippet, reads it, updates it, searches for it', async () => {
    // 1. Create snippet
    const created = await createSnippet({ ... });
    expect(created.id).toBeDefined();

    // 2. Read snippet
    const fetched = await fetchSnippetById(created.id);
    expect(fetched.title).toBe(created.title);

    // 3. Update snippet
    const updated = await updateSnippet(created.id, { title: 'Updated' });
    expect(updated.title).toBe('Updated');

    // 4. Search finds updated snippet
    const results = await fetchSnippets({ search: 'Updated' });
    expect(results.data).toContainEqual(expect.objectContaining({ id: created.id }));
  });
});

describe('AI-assisted snippet creation', () => {
  test('user creates snippet with AI-generated description and tags', async () => {
    const code = 'function sort(arr) { return arr.sort(); }';

    // 1. Generate description
    const desc = await generateDescriptionAPI({ code, language: 'javascript' });

    // 2. Suggest tags
    const tags = await suggestTags({ code, language: 'javascript' });

    // 3. Create snippet with AI content
    const snippet = await createSnippet({
      title: 'Sort function',
      code,
      language: 'javascript',
      ai_description: desc.description,
      tags: tags.tags,
    });

    expect(snippet.ai_description).toBeDefined();
    expect(snippet.tags?.length).toBeGreaterThan(0);
  });
});
```

**Estimated Effort:** 4-5 hours

---

## Test Data Management

### Test Fixtures

Create `src/__integration__/fixtures/snippets.ts`:

```typescript
export const TEST_SNIPPETS = {
  javascript: {
    title: 'Array Sort Function',
    code: 'function sort(arr) { return arr.sort(); }',
    language: 'javascript',
    description: 'Sorts an array',
    tags: ['javascript', 'array', 'sort'],
  },
  python: {
    title: 'Hello World',
    code: 'print("Hello, World!")',
    language: 'python',
    description: 'Prints hello world',
    tags: ['python', 'print', 'hello'],
  },
  // ... more fixtures
};

export const MOCK_OPENAI_RESPONSES = {
  suggestTags: {
    tags: ['javascript', 'function', 'array', 'sorting'],
  },
  explainCode: {
    explanation: 'This function sorts an array using the built-in sort method.',
  },
  generateDescription: {
    description: 'Sorts an array in place and returns the sorted array.',
  },
};
```

### Database Cleanup Helpers

Create `src/__integration__/helpers/db-cleanup.ts`:

```typescript
import { testSupabase, TEST_USER } from '../setup';

export async function deleteAllTestSnippets() {
  await testSupabase
    .from('snippets')
    .delete()
    .eq('user_id', TEST_USER.user_id);
}

export async function createTestSnippet(data: any) {
  const { data: snippet, error } = await testSupabase
    .from('snippets')
    .insert({ ...data, user_id: TEST_USER.user_id })
    .select()
    .single();

  if (error) throw error;
  return snippet;
}
```

---

## Mocking External Services

### OpenAI API Mocking

Create `src/__integration__/mocks/openai.mock.ts`:

```typescript
import { beforeAll, afterAll } from 'vitest';
import nock from 'nock';

export function mockOpenAI() {
  beforeAll(() => {
    nock('https://api.openai.com')
      .post('/v1/chat/completions')
      .reply(200, {
        choices: [{
          message: {
            content: JSON.stringify({
              tags: ['javascript', 'function', 'array'],
            }),
          },
        }],
      });
  });

  afterAll(() => {
    nock.cleanAll();
  });
}
```

---

## Running Integration Tests

### Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run src/__tests__",
    "test:integration": "vitest run src/__integration__",
    "test:integration:watch": "vitest src/__integration__",
    "test:all": "vitest run",
    "test:coverage": "vitest --coverage"
  }
}
```

### Separate Integration from Unit Tests

**Option 1: Separate directories**
- Unit tests: `src/__tests__/**/*.test.ts`
- Integration tests: `src/__integration__/**/*.integration.test.ts`

**Option 2: File naming**
- Unit tests: `*.test.ts`
- Integration tests: `*.integration.test.ts`

---

## Implementation Order

### Week 1: Setup + Critical Endpoints
1. Set up test database and test user
2. Create integration test helpers (auth, cleanup)
3. Implement `GET /api/snippets` tests (30+ tests)
4. Implement `GET /api/snippets/{id}` tests (8+ tests)

### Week 2: CRUD Completion
5. Implement `POST /api/snippets` tests (20+ tests)
6. Implement `PUT /api/snippets/{id}` tests (20+ tests)
7. Implement authentication middleware tests (12+ tests)

### Week 3: AI Features
8. Set up OpenAI mocking
9. Implement AI endpoint tests (30+ tests)

### Week 4: Service Layer + Polish
10. Implement service layer tests (20+ tests)
11. Implement API client tests (15+ tests)
12. Add E2E workflow tests (5+ tests)

---

## Coverage Goals

**Target Coverage:**
- API Endpoints: **95%+** (critical path)
- Authentication: **95%+** (security critical)
- Service Layer: **85%+** (database queries)
- API Client: **80%+** (frontend integration)

**Overall Target:** 85%+ coverage on integration-tested components

---

## Best Practices

### Do's ✅
- Use real database for integration tests (separate test instance)
- Mock external APIs (OpenAI) to avoid costs and flakiness
- Clean up test data after each test
- Test error paths, not just happy paths
- Use fixtures for consistent test data
- Test authentication on all protected routes
- Verify database state changes

### Don'ts ❌
- Don't rely on test execution order
- Don't use production database
- Don't make real OpenAI API calls in tests
- Don't skip authentication tests
- Don't test UI components here (use E2E tests)
- Don't hardcode test data IDs (use generated IDs)

---

## Comparison: Integration vs Unit vs E2E

| Aspect | Unit Tests | Integration Tests | E2E Tests |
|--------|-----------|-------------------|-----------|
| **Scope** | Single function | API endpoint + DB | Full user flow |
| **Speed** | Very fast (ms) | Medium (100-500ms) | Slow (seconds) |
| **Dependencies** | None (mocked) | Real DB, mocked external APIs | Real everything |
| **When to Use** | Pure functions, validators | API routes, services | Critical user journeys |
| **Examples** | `validateSnippetId()` | `POST /api/snippets` | "User creates and shares snippet" |

**Our Strategy:**
- Unit tests: Validators, utilities, error handlers ✅ (179 tests done)
- Integration tests: API endpoints, auth, services (this plan)
- E2E tests: User workflows with Playwright (existing)

---

## Summary

**Total Estimated Effort:** 30-40 hours

**Priority Breakdown:**
- 🔴 Priority 0 (Critical): 13-16 hours → **Implement first**
- 🟡 Priority 1 (High): 9-12 hours → **Implement second**
- 🟢 Priority 2 (Optional): 7-10 hours → **Implement third**
- 🔵 Priority 3 (E2E): 4-5 hours → **Defer to E2E suite**

**Expected Outcomes:**
- 150+ integration tests covering all API endpoints
- Confidence in API layer correctness
- Early detection of authentication/authorization bugs
- Database query validation
- Protection against breaking changes
- Faster debugging of integration issues

**Next Steps for Implementation Agent:**
1. Read this document completely
2. Set up test database (Supabase test project)
3. Create integration test setup files
4. Start with Priority 0, Test Candidate #1 (snippet CRUD)
5. Follow test case structure provided
6. Run tests frequently to ensure they pass
7. Proceed sequentially through priorities

---

**Document End**
