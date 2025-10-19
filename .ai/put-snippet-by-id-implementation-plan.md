# API Endpoint Implementation Plan: PUT /api/snippets/{id}

## 1. Endpoint Overview

This endpoint updates an existing code snippet for the authenticated user. It supports partial updates, allowing clients to send only the fields they want to modify. The endpoint verifies ownership before permitting any updates and automatically updates the `updated_at` timestamp via a database trigger. All validation rules from snippet creation apply to the fields being updated.

## 2. Request Details

- **HTTP Method**: PUT
- **URL Structure**: `/api/snippets/{id}`
- **Authentication**: Required (JWT Bearer token)
- **Content-Type**: application/json

### Path Parameters

**Required Parameters:**

| Parameter | Type | Validation | Description |
|-----------|------|------------|-------------|
| `id` | string (UUID) | Must be valid UUID v4 format | Unique identifier of the snippet to update |

### Request Body

**All fields are optional (partial update support):**

| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| `title` | string | Max 255 chars, non-empty after trim | Updated snippet title |
| `code` | string | Max 50,000 chars, non-empty after trim | Updated source code |
| `language` | string | Must be one of 13 supported languages | Updated programming language |
| `description` | string \| null | TEXT, optional | Updated user description |
| `tags` | string[] | Array of strings, 2-30 chars each | Updated tags |
| `ai_description` | string \| null | TEXT, optional | Updated AI description |
| `ai_explanation` | string \| null | TEXT, optional | Updated AI explanation |
| `is_favorite` | boolean | Must be boolean | Updated favorite status |

**Example Request (Partial Update):**
```http
PUT /api/snippets/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "title": "Improved factorial function",
  "ai_description": "This recursive function calculates factorial with memoization",
  "tags": ["recursion", "math", "optimization"]
}
```

**Example Request (Full Update):**
```http
PUT /api/snippets/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "title": "Factorial with memoization",
  "code": "const memo = {}; function factorial(n) { if (n <= 1) return 1; return memo[n] || (memo[n] = n * factorial(n-1)); }",
  "language": "javascript",
  "description": "Optimized factorial with caching",
  "tags": ["recursion", "optimization", "memoization"],
  "is_favorite": true,
  "ai_description": "Factorial with memoization for performance",
  "ai_explanation": "Uses a cache object to store previously computed values..."
}
```

## 3. Used Types

### Path Parameter DTO
```typescript
interface SnippetIdParamDTO {
  id: string; // UUID format
}
```

### Request DTO (Partial Update)
```typescript
interface UpdateSnippetRequestDTO {
  title?: string;
  code?: string;
  language?: string;
  description?: string | null;
  tags?: string[];
  ai_description?: string | null;
  ai_explanation?: string | null;
  is_favorite?: boolean;
}
```

### Service Command Model
```typescript
interface UpdateSnippetCommand {
  id: string;
  user_id: string;
  updates: {
    title?: string;
    code?: string;
    language?: string;
    description?: string | null;
    tags?: string[];
    ai_description?: string | null;
    ai_explanation?: string | null;
    is_favorite?: boolean;
  };
}
```

### Response DTO
```typescript
interface SnippetResponseDTO {
  id: string;
  title: string;
  code: string;
  language: string;
  description: string | null;
  ai_description: string | null;
  ai_explanation: string | null;
  tags: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string; // Will be auto-updated
}
```

## 4. Response Details

### Success Response (200 OK)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Improved factorial function",
  "code": "function factorial(n) { return n <= 1 ? 1 : n * factorial(n-1); }",
  "language": "javascript",
  "description": "Calculates factorial recursively",
  "ai_description": "This recursive function calculates factorial with memoization",
  "ai_explanation": null,
  "tags": ["recursion", "math", "optimization"],
  "is_favorite": false,
  "created_at": "2025-10-19T10:30:00Z",
  "updated_at": "2025-10-19T15:45:00Z"
}
```

### Error Responses

**401 Unauthorized**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid authentication token"
  }
}
```

**404 Not Found**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Snippet not found"
  }
}
```

**400 Bad Request - Validation Error**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "errors": [
        {
          "field": "title",
          "message": "Title must not be empty"
        },
        {
          "field": "code",
          "message": "Code exceeds maximum length of 50000 characters"
        }
      ]
    }
  }
}
```

**400 Bad Request - Empty Update**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "At least one field must be provided for update"
  }
}
```

**500 Internal Server Error**
```json
{
  "error": {
    "code": "DATABASE_ERROR",
    "message": "Failed to update snippet"
  }
}
```

## 5. Data Flow

```
1. Client sends PUT request with snippet ID and partial/full update
   ↓
2. API Route Handler receives request
   ↓
3. JWT Middleware validates authentication token
   → Extract user_id from token
   ↓
4. Validation Layer validates path parameter
   → Validate ID is valid UUID format
   ↓
5. Request Body Parser parses JSON
   → Verify Content-Type: application/json
   → Parse request body
   → Check at least one field provided
   ↓
6. Validation Layer validates provided fields only
   → If title provided: max 255, non-empty after trim
   → If code provided: max 50000, non-empty after trim
   → If language provided: must be supported
   → If tags provided: validate array format
   → If is_favorite provided: must be boolean
   → Collect validation errors
   → If errors, return 400 with details
   ↓
7. Transform to UpdateSnippetCommand
   → Add id from path parameter
   → Add user_id from authenticated user
   → Add updates object with provided fields
   → Trim whitespace from title/code if provided
   ↓
8. SnippetService.updateSnippet(command)
   → First, verify snippet exists and belongs to user:
     SELECT id FROM snippets WHERE id = $1 AND user_id = $2
   → If not found, return null (404 error)
   → Build dynamic UPDATE query with only provided fields
   → Execute UPDATE with RETURNING *
   ↓
9. Database (PostgreSQL + RLS + Trigger)
   → RLS enforces user_id = auth.uid() (UPDATE policy)
   → CHECK constraints validate title/code if updated
   → Trigger auto-updates updated_at timestamp
   → Return complete updated row
   ↓
10. Service transforms DB result to DTO
    → Format timestamps to ISO 8601
    ↓
11. Return 200 OK with complete updated snippet
```

## 6. Security Considerations

### Authentication
- **JWT Validation**: Every request must include valid Bearer token
- **Token Extraction**: Extract user_id from `auth.uid()` via Supabase
- **Session Validation**: Ensure token is not expired or revoked

### Authorization
- **Ownership Verification**: Query includes `user_id = $user_id` filter
- **Pre-Update Check**: Verify snippet exists and belongs to user before update
- **Database RLS**: UPDATE policy enforces `auth.uid() = user_id`
- **Defense in Depth**: Application-level + database-level checks
- **No Information Leakage**: Return 404 for both "not found" and "not owned"

### Input Validation
- **Partial Update Safety**: Validate only provided fields
- **Empty Update Prevention**: Require at least one field to be updated
- **UUID Validation**: Validate ID parameter against UUID format
- **SQL Injection Prevention**: Use parameterized queries
- **XSS Prevention**: Sanitize description on output (code preserved as-is)

### Data Integrity
- **Atomic Updates**: Use database transactions
- **Concurrent Update Handling**: Database handles via row locking
- **Trigger Reliability**: updated_at always updated by database
- **Constraint Enforcement**: Database CHECK constraints apply to updates

### Race Condition Mitigation
- **Row-Level Locking**: PostgreSQL handles concurrent updates
- **Optimistic Locking**: Consider adding version field in future
- **Last-Write-Wins**: Current strategy (acceptable for this use case)

## 7. Error Handling

### Validation Errors (400)

| Scenario | Field | Error Message |
|----------|-------|---------------|
| No fields provided | body | At least one field must be provided for update |
| Invalid UUID format | id | Invalid snippet ID format |
| Empty title (after trim) | title | Title must not be empty |
| Title too long | title | Title exceeds maximum length of 255 characters |
| Empty code (after trim) | code | Code must not be empty |
| Code too long | code | Code exceeds maximum length of 50000 characters |
| Invalid language | language | Unsupported language. Must be one of: javascript, typescript, ... |
| Invalid tags format | tags | Tags must be an array of strings |
| Tag too short | tags | Each tag must be at least 2 characters |
| Tag too long | tags | Each tag must not exceed 30 characters |
| Invalid is_favorite | is_favorite | is_favorite must be a boolean |
| Invalid JSON | body | Invalid JSON format |

### Authentication Errors (401)
| Scenario | Error Code | Message |
|----------|------------|---------|
| Missing token | UNAUTHORIZED | Missing authentication token |
| Invalid token | UNAUTHORIZED | Invalid authentication token |
| Expired token | UNAUTHORIZED | Authentication token expired |

### Authorization Errors (404)
| Scenario | Error Code | Message | Note |
|----------|------------|---------|------|
| Snippet doesn't exist | NOT_FOUND | Snippet not found | Don't reveal existence |
| Snippet belongs to another user | NOT_FOUND | Snippet not found | Security: same message |

### Server Errors (500)
| Scenario | Error Code | Message |
|----------|------------|---------|
| Database connection failure | DATABASE_ERROR | Failed to connect to database |
| Update query failure | DATABASE_ERROR | Failed to update snippet |
| Constraint violation | DATABASE_ERROR | Invalid update operation |
| RLS policy violation | FORBIDDEN | Permission denied |
| Unexpected exception | INTERNAL_ERROR | An unexpected error occurred |

### Error Logging
- Log all 500 errors with full stack trace
- Log 404 errors with user_id and requested snippet_id (for security monitoring)
- Log authentication failures
- Include request ID for error tracking
- Sanitize code content in logs (truncate to 100 chars)

## 8. Performance Considerations

### Database Optimization
- **Indexes**: Uses primary key on `id` + `user_id` index for ownership check
- **Two Queries**:
  1. Existence/ownership check (fast, indexed)
  2. Update operation (fast, primary key)
- **Alternative**: Single UPDATE with RETURNING (fails silently if not found)
- **Transaction**: Wrap in transaction for consistency

### Update Query Building
- **Dynamic Query**: Only update provided fields (don't set unchanged values)
- **Prepared Statement**: Reuse query structure with different parameters

### Response Time Targets
- **95th percentile**: <100ms (single-row update with index)
- **99th percentile**: <200ms

### Trigger Overhead
- **updated_at Trigger**: Minimal overhead (simple timestamp update)
- **No Additional Triggers**: Keep triggers lightweight

### Bottlenecks
- Ownership verification query (mitigated by indexes)
- Large code field updates (network transfer)
- RLS policy evaluation (minimal for single row)

## 9. Implementation Steps

### Step 1: Reuse/Define Type Definitions
1. Reuse `SnippetIdParamDTO` from GET endpoint
2. Create `UpdateSnippetRequestDTO` in `src/types/snippet.dto.ts`
3. Define `UpdateSnippetCommand` for service layer
4. Reuse `SnippetResponseDTO`

### Step 2: Create Validation Schema
1. Update `src/validators/snippet.validator.ts`
2. Define partial validation schema for UpdateSnippetRequestDTO:
   ```typescript
   const updateSnippetSchema = z.object({
     title: z.string().min(1).max(255).transform(s => s.trim()).optional(),
     code: z.string().min(1).max(50000).transform(s => s.trim()).optional(),
     language: z.enum(SUPPORTED_LANGUAGES).optional(),
     description: z.string().nullable().optional(),
     tags: z.array(z.string().min(2).max(30)).max(20).optional(),
     ai_description: z.string().nullable().optional(),
     ai_explanation: z.string().nullable().optional(),
     is_favorite: z.boolean().optional()
   }).refine(data => Object.keys(data).length > 0, {
     message: "At least one field must be provided for update"
   });
   ```
3. Export validation function

### Step 3: Create/Update Service Layer
1. Update `src/services/snippet.service.ts`
2. Implement `updateSnippet(command: UpdateSnippetCommand)` method
3. Step 1: Verify ownership
   ```sql
   SELECT id FROM snippets WHERE id = $1 AND user_id = $2
   ```
4. Step 2: Build dynamic UPDATE query
   ```typescript
   const fields = Object.keys(command.updates);
   const setClause = fields.map((field, i) => `${field} = $${i + 3}`).join(', ');
   const query = `UPDATE snippets SET ${setClause} WHERE id = $1 AND user_id = $2 RETURNING *`;
   ```
5. Execute UPDATE with parameterized values
6. Transform result to SnippetResponseDTO
7. Handle not found (return null)

### Step 4: Reuse Authentication Middleware
1. Reuse `src/middleware/auth.middleware.ts`
2. Extract user_id from validated JWT token

### Step 5: Create API Route Handler
1. Update `src/pages/api/snippets/[id].ts` (add PUT handler)
2. Apply authentication middleware
3. Extract and validate path parameter `id`
4. Parse and validate request body
5. Check at least one field provided
6. Collect validation errors (return all at once)
7. Transform to UpdateSnippetCommand
8. Call `SnippetService.updateSnippet(command)`
9. If null (not found), return 404
10. If successful, return 200 OK with updated snippet
11. Handle exceptions and map to status codes

### Step 6: Error Handling Implementation
1. Reuse/enhance `src/utils/error-handler.ts`
2. Handle Zod validation errors for partial updates
3. Ensure consistent 404 messaging
4. Map database constraint violations

### Step 7: Add Concurrency Handling (Optional)
1. Consider adding optimistic locking with version field
2. Alternative: rely on PostgreSQL row-level locking
3. Document behavior for concurrent updates

### Step 8: Testing
1. Write unit tests for partial update validation
2. Write unit tests for service layer
3. Write integration tests for API endpoint
4. Test scenarios:
   - Successful partial update (single field)
   - Successful partial update (multiple fields)
   - Successful full update (all fields)
   - Empty update (no fields provided)
   - Validation errors on provided fields
   - Update non-existent snippet (404)
   - Update snippet owned by another user (404)
   - Invalid UUID format (400)
   - Missing authentication token (401)
   - Expired/invalid token (401)
   - Database errors (500)
   - RLS policy enforcement
   - Verify updated_at is auto-updated
   - Concurrent updates (race condition testing)
5. Verify is_favorite toggle works correctly

### Step 9: Documentation
1. Update API documentation
2. Document partial update capability
3. Add example requests for various scenarios
4. Document field-specific validation rules
5. Document updated_at auto-update behavior

### Step 10: Deployment Checklist
1. Verify database trigger for updated_at exists
2. Verify RLS UPDATE policy is enabled
3. Test partial and full updates
4. Verify ownership checks work correctly
5. Test concurrent updates behavior
6. Monitor response times
7. Set up alerts for high error rates
8. Verify error logging integration
