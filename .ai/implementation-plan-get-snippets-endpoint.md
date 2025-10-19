# Implementation Plan: GET /api/snippets Endpoint

## Branch: `feature/api-snippets-endpoint`

---

## Executive Summary

This plan outlines the implementation of the GET /api/snippets REST API endpoint to replace the current client-side Supabase direct database access pattern. The implementation follows the architecture defined in `.ai/get-snippets-implementation-plan.md` and aligns with the Technical Architecture Document (TAD).

---

## Current State Analysis

### Existing Implementation
- **Location**: `src/lib/supabase.ts:69-79`
- **Pattern**: Direct client-side Supabase queries
- **Component**: `src/components/snippets/SnippetList.tsx:19-34`
- **Issues**:
  1. Client-side filtering is inefficient (loads all data, filters in browser)
  2. No server-side pagination support
  3. Search query uses simple `ilike` instead of PostgreSQL full-text search
  4. No standardized error handling
  5. No rate limiting or request validation
  6. Exposes database structure to client

### Dependencies Identified
- `@supabase/supabase-js`: ^2.46.1
- `astro`: ^5.0.3
- `@astrojs/react`: ^4.0.0
- `react`: ^19.0.0
- TypeScript

### Missing Dependencies (To Install)
- `zod`: ^3.x - For request validation
- None others required (Supabase client handles auth)

---

## Implementation Plan

### Phase 1: Foundation (Steps 1-4)

#### Step 1: Install Dependencies
```bash
npm install zod
```

#### Step 2: Create Type Definitions
**File**: `src/types/snippet.dto.ts`
- Create `SnippetListQueryDTO`
- Create `SnippetResponseDTO` (extend existing `Snippet` type)
- Create `PaginatedSnippetsResponseDTO`
- Create `GetSnippetsCommand`

**File**: `src/constants/snippet.constants.ts`
- Export `SUPPORTED_LANGUAGES` array (reuse from `src/config/languages.ts`)
- Define validation rules constants

#### Step 3: Create Validation Schema
**File**: `src/validators/snippet.validator.ts`
- Define Zod schema for query parameters
- Export validation function
- Handle default values (page=1, limit=20, sort=created_at, order=desc)

#### Step 4: Create Authentication Middleware
**File**: `src/middleware/auth.middleware.ts`
- Extract JWT from Authorization header
- Validate token using Supabase
- Extract user_id from token
- Attach user to request context
- Return 401 for invalid/missing tokens

### Phase 2: Service Layer (Steps 5-6)

#### Step 5: Create Service Layer
**File**: `src/services/snippet.service.ts`
- Implement `getSnippets(command: GetSnippetsCommand)` method
- Build dynamic PostgreSQL query with filters:
  - Base: `WHERE user_id = $1`
  - Language filter: `AND language = $2`
  - Tags filter: `AND tags && $tags` (array overlap operator)
  - Full-text search: Use `to_tsvector` and `@@` operator on indexed column
  - Sorting: Dynamic ORDER BY with validated fields
  - Pagination: OFFSET and LIMIT
- Execute COUNT query for total records
- Transform results to DTOs
- Format timestamps to ISO 8601

#### Step 6: Error Handling
**File**: `src/utils/error-handler.ts`
- Define standard error response format
- Map error types to HTTP status codes
- Create error logging utility
- Add request context (request ID, timestamp)

### Phase 3: API Route (Steps 7-8)

#### Step 7: Create API Route Handler
**File**: `src/pages/api/snippets/index.ts`
- Import and apply authentication middleware
- Extract query parameters from URL
- Validate using Zod schema
- Transform to `GetSnippetsCommand`
- Call `SnippetService.getSnippets()`
- Handle errors and return appropriate status codes
- Return paginated JSON response

#### Step 8: Response Formatting
- Calculate `total_pages = ceil(total / limit)`
- Format timestamps to ISO 8601
- Structure response per API spec

### Phase 4: Frontend Refactoring (Steps 9-10)

#### Step 9: Create API Client Utility
**File**: `src/lib/api-client.ts`
- Create `fetchSnippets()` function
- Handle authentication token from Supabase
- Build query string from parameters
- Make fetch request to `/api/snippets`
- Parse response
- Handle errors

#### Step 10: Refactor SnippetList Component
**File**: `src/components/snippets/SnippetList.tsx`
- Replace `getSnippets()` call with API client
- Update to handle pagination from server
- Remove client-side filtering (keep UI controls)
- Pass filters to API instead
- Handle loading and error states
- Display pagination metadata

### Phase 5: Testing (Steps 11-12)

#### Step 11: Unit Tests
- Validation schema tests (valid/invalid inputs)
- Service layer tests (mock Supabase)
- Error handler tests

#### Step 12: Integration Tests
- Test API endpoint with various query params
- Test authentication (valid, invalid, missing token)
- Test pagination edge cases
- Test filters (language, tags, search)
- Test error scenarios (400, 401, 500)

### Phase 6: Documentation & Deployment (Steps 13-14)

#### Step 13: Documentation
- Update API documentation
- Add inline code comments
- Document query parameter examples

#### Step 14: Deployment Checklist
- Verify database indexes exist (run migration if needed)
- Test with production-like data volume
- Verify HTTPS enforcement
- Test error logging
- Monitor response times

---

## Acceptance Criteria

### Functional Requirements

#### ✅ FR-1: Authentication
- [ ] Endpoint requires valid JWT Bearer token
- [ ] Returns 401 for missing token
- [ ] Returns 401 for invalid/expired token
- [ ] Extracts user_id from token correctly

#### ✅ FR-2: Pagination
- [ ] Supports `page` query parameter (default: 1)
- [ ] Supports `limit` query parameter (default: 20, max: 100)
- [ ] Returns pagination metadata (page, limit, total, total_pages)
- [ ] Calculates total_pages correctly
- [ ] Handles page=0 and negative pages gracefully

#### ✅ FR-3: Sorting
- [ ] Supports `sort` parameter (created_at, updated_at, title)
- [ ] Supports `order` parameter (asc, desc)
- [ ] Defaults to created_at DESC
- [ ] Rejects invalid sort fields

#### ✅ FR-4: Language Filter
- [ ] Supports `language` query parameter
- [ ] Validates against supported languages list
- [ ] Returns filtered results
- [ ] Returns all languages when not specified

#### ✅ FR-5: Tags Filter
- [ ] Supports `tags` query parameter (comma-separated)
- [ ] Uses PostgreSQL array overlap operator
- [ ] Returns snippets matching ANY of the provided tags
- [ ] Handles empty tags gracefully

#### ✅ FR-6: Full-Text Search
- [ ] Supports `search` query parameter
- [ ] Uses PostgreSQL `to_tsvector` on indexed column
- [ ] Searches across title, description, and ai_description
- [ ] Returns ranked results
- [ ] Handles special characters safely

#### ✅ FR-7: Data Isolation
- [ ] Users can only see their own snippets (RLS enforced)
- [ ] Application-level user_id filter applied
- [ ] No cross-user data leakage

#### ✅ FR-8: Response Format
- [ ] Returns JSON with `data` and `pagination` keys
- [ ] Timestamps in ISO 8601 format
- [ ] All snippet fields included
- [ ] Error responses follow standard format

### Non-Functional Requirements

#### ✅ NFR-1: Performance
- [ ] 95th percentile response time <200ms (without search)
- [ ] 95th percentile response time <500ms (with search)
- [ ] Uses database indexes effectively (verify with EXPLAIN)
- [ ] COUNT query optimized

#### ✅ NFR-2: Security
- [ ] SQL injection prevented (parameterized queries)
- [ ] XSS prevention (sanitized output)
- [ ] HTTPS enforced
- [ ] No sensitive data in responses
- [ ] Rate limiting considered for future

#### ✅ NFR-3: Error Handling
- [ ] All errors return structured JSON
- [ ] Error codes consistent (VALIDATION_ERROR, UNAUTHORIZED, etc.)
- [ ] 500 errors logged with stack trace
- [ ] User-friendly error messages
- [ ] Request ID in error logs

#### ✅ NFR-4: Code Quality
- [ ] TypeScript strict mode passes
- [ ] ESLint passes with no errors
- [ ] Code commented appropriately
- [ ] Follows project conventions
- [ ] Reusable utilities extracted

### Frontend Integration

#### ✅ FE-1: Component Refactoring
- [ ] SnippetList uses API endpoint instead of direct Supabase
- [ ] Loading states handled correctly
- [ ] Error states displayed to user
- [ ] Filters trigger API calls with correct parameters
- [ ] Search debounced (300ms)
- [ ] No console errors

#### ✅ FE-2: Backward Compatibility
- [ ] UI behavior unchanged from user perspective
- [ ] All existing features work (search, filter, display)
- [ ] Performance improved (perceived or actual)

### Testing Requirements

#### ✅ T-1: Unit Tests
- [ ] Validation schema: 5+ test cases
- [ ] Service layer: 8+ test cases
- [ ] Error handler: 3+ test cases
- [ ] 80%+ code coverage for new code

#### ✅ T-2: Integration Tests
- [ ] Happy path: successful retrieval
- [ ] Pagination: various page/limit combinations
- [ ] Filters: language, tags, search, combinations
- [ ] Auth: missing, invalid, expired tokens
- [ ] Errors: 400, 401, 500 scenarios
- [ ] Edge cases: empty results, max limit exceeded

#### ✅ T-3: Manual Testing
- [ ] Test in browser with real data
- [ ] Verify network tab shows correct requests
- [ ] Verify response payloads correct
- [ ] Test on mobile viewport
- [ ] Verify error messages user-friendly

---

## Implementation Order

### Day 1: Foundation
1. Install zod
2. Create type definitions
3. Create validation schema
4. Create auth middleware

### Day 2: Service & API
5. Create service layer
6. Create error handler
7. Create API route handler
8. Response formatting

### Day 3: Frontend & Testing
9. Create API client utility
10. Refactor SnippetList component
11. Write unit tests
12. Write integration tests

### Day 4: Polish & Deploy
13. Documentation
14. Deployment checklist
15. Manual testing
16. Code review & merge

---

## Rollback Plan

If critical issues arise:

1. **Immediate Rollback**: Revert SnippetList.tsx to use direct Supabase calls
2. **Keep API Code**: Leave API endpoint in place but unused
3. **Fix Forward**: Address issues in new branch
4. **Gradual Migration**: Add feature flag to toggle between old/new approach

---

## Success Metrics

### Technical Metrics
- Response time: <200ms (95th percentile)
- Error rate: <1%
- Test coverage: >80%
- Zero security vulnerabilities

### User Experience Metrics
- Page load time: maintained or improved
- Search response: <500ms
- Zero regressions in functionality
- No increase in error reports

---

## Dependencies & Blockers

### Dependencies
- ✅ Database migration already exists (supabase/migrations/20251019000000_create_snippets_table.sql)
- ✅ Indexes already defined in migration
- ⚠️  Need to install: `zod`

### Potential Blockers
- ⚠️  Database indexes not applied (need to run migration)
- ⚠️  Supabase environment variables not set in deployment
- ⚠️  CORS configuration may need adjustment for API routes

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing functionality | Medium | High | Comprehensive testing, gradual rollout |
| Performance degradation | Low | Medium | Load testing, database indexes verified |
| Database migration issues | Low | High | Test migration in staging first |
| Authentication issues | Low | Critical | Thorough auth testing, keep fallback |
| Deployment failures | Low | Medium | Vercel preview deployments, rollback plan |

---

## Review Checkpoints

### Before Starting Implementation
- [ ] Plan reviewed and approved
- [ ] Dependencies installed
- [ ] Database migration verified in staging
- [ ] Team aligned on approach

### Before Frontend Refactoring
- [ ] API endpoint tested independently (Postman/curl)
- [ ] Unit tests passing
- [ ] Performance benchmarks acceptable
- [ ] Error handling verified

### Before Merge to Main
- [ ] All acceptance criteria met
- [ ] Code review completed
- [ ] Integration tests passing
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Deployment checklist verified

---

## Notes

- **Architecture Alignment**: This implementation follows TAD section 6 (AI Integration Architecture) pattern for API routes
- **Reusability**: Auth middleware, error handler, and validation utilities are designed for reuse with other endpoints
- **Future Work**: Consider adding response caching (Redis) for popular queries
- **Monitoring**: Set up alerts for response time >500ms and error rate >5%

---

**Status**: Ready for Implementation
**Estimated Effort**: 4 days
**Priority**: High
**Dependencies**: None blocking
