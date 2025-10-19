# API Endpoint Implementation Plan: GET /api/snippets/{id}

## 1. Endpoint Overview

This endpoint retrieves detailed information for a specific code snippet by its unique identifier. It ensures that only the authenticated owner of the snippet can access it, providing defense-in-depth security through both application-level checks and database Row-Level Security policies.

## 2. Request Details

- **HTTP Method**: GET
- **URL Structure**: `/api/snippets/{id}`
- **Authentication**: Required (JWT Bearer token)

### Path Parameters

**Required Parameters:**

| Parameter | Type | Validation | Description |
|-----------|------|------------|-------------|
| `id` | string (UUID) | Must be valid UUID v4 format | Unique identifier of the snippet |

**Example Request:**
```
GET /api/snippets/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer eyJhbGc...
```

## 3. Used Types

### Path Parameter DTO
```typescript
interface SnippetIdParamDTO {
  id: string; // UUID format
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
  updated_at: string;
}
```

### Service Command Model
```typescript
interface GetSnippetByIdCommand {
  id: string;
  user_id: string;
}
```

## 4. Response Details

### Success Response (200 OK)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Factorial function",
  "code": "function factorial(n) { return n <= 1 ? 1 : n * factorial(n-1); }",
  "language": "javascript",
  "description": "Calculates factorial recursively",
  "ai_description": "This function calculates the factorial of a number using recursion",
  "ai_explanation": "1. The function checks if n is less than or equal to 1...",
  "tags": ["recursion", "math", "algorithm"],
  "is_favorite": true,
  "created_at": "2025-10-15T10:30:00Z",
  "updated_at": "2025-10-16T14:22:00Z"
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

**400 Bad Request**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid snippet ID format",
    "details": {
      "field": "id",
      "constraint": "must_be_valid_uuid"
    }
  }
}
```

**500 Internal Server Error**
```json
{
  "error": {
    "code": "DATABASE_ERROR",
    "message": "Failed to retrieve snippet"
  }
}
```

## 5. Data Flow

```
1. Client sends GET request with snippet ID in path
   ↓
2. API Route Handler receives request
   ↓
3. JWT Middleware validates authentication token
   → Extract user_id from token
   ↓
4. Validation Layer validates path parameter
   → Validate ID is valid UUID format
   ↓
5. SnippetService.getSnippetById(command)
   → Build query: SELECT * FROM snippets WHERE id = $1 AND user_id = $2
   → Execute query with RLS enforcement
   ↓
6. Database (PostgreSQL + RLS)
   → RLS enforces user_id = auth.uid()
   → Uses index: idx_snippets_user_id + primary key on id
   → Returns snippet if found and owned by user
   ↓
7. Service checks result
   → If null, return NOT_FOUND error
   → If found, transform to DTO
   ↓
8. Response Builder formats snippet data
   → Format timestamps to ISO 8601
   ↓
9. Return 200 OK with JSON response
```

## 6. Security Considerations

### Authentication
- **JWT Validation**: Every request must include valid Bearer token
- **Token Extraction**: Extract user_id from `auth.uid()` via Supabase
- **Session Validation**: Ensure token is not expired or revoked

### Authorization
- **Ownership Verification**: Query includes `user_id = $user_id` filter
- **Database RLS**: Additional enforcement at database level
- **Defense in Depth**: Application-level + database-level checks
- **No Information Leakage**: Return same 404 error whether snippet doesn't exist or belongs to another user

### Input Validation
- **UUID Validation**: Validate ID parameter against UUID v4 format
- **SQL Injection Prevention**: Use parameterized queries
- **Path Traversal Prevention**: UUID validation prevents path manipulation

### Data Security
- **HTTPS Only**: All API traffic must use HTTPS
- **Complete Data**: Return all snippet fields as specified
- **No Sensitive Data**: Response doesn't include other users' data

### Privacy Protection
- **Error Message Consistency**: Don't reveal if snippet exists but belongs to another user
- **Timing Attack Mitigation**: Keep response times similar for "not found" vs "not owned"

## 7. Error Handling

### Validation Errors (400)
| Scenario | Error Code | Message |
|----------|------------|---------|
| Invalid UUID format | VALIDATION_ERROR | Invalid snippet ID format |
| Malformed ID parameter | VALIDATION_ERROR | Snippet ID is required |

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
| Query execution failure | DATABASE_ERROR | Failed to retrieve snippet |
| Unexpected exception | INTERNAL_ERROR | An unexpected error occurred |

### Error Logging
- Log all 500 errors with full stack trace
- Log 404 errors with user_id and requested snippet_id (for security monitoring)
- Log authentication failures for security monitoring
- Include request ID for error tracking
- Do NOT log actual snippet content

## 8. Performance Considerations

### Database Optimization
- **Indexes**: Utilize existing indexes
  - Primary key index on `id` (automatic)
  - B-tree index on `user_id`
- **Query Simplicity**: Single-row lookup with primary key
- **RLS Overhead**: Minimal for single-row queries

### Response Time Targets
- **95th percentile**: <50ms (simple primary key lookup)
- **99th percentile**: <100ms

### Caching Strategy (Future Enhancement)
- Cache frequently accessed snippets
- Use Redis with snippet ID as key
- TTL: 5 minutes
- Invalidate on update/delete

### Bottlenecks
- Minimal bottlenecks expected
- Network latency more significant than query time
- RLS policy evaluation (negligible for single row)

## 9. Implementation Steps

### Step 1: Reuse/Create Type Definitions
1. Reuse `SnippetResponseDTO` from GET /api/snippets
2. Create `SnippetIdParamDTO` in `src/types/snippet.dto.ts`
3. Define `GetSnippetByIdCommand` for service layer

### Step 2: Create Validation Schema
1. Update `src/validators/snippet.validator.ts`
2. Add UUID validation schema
3. Implement UUID format validation (regex or library)
4. Create path parameter validation middleware

### Step 3: Create/Update Service Layer
1. Update `src/services/snippet.service.ts`
2. Implement `getSnippetById(command: GetSnippetByIdCommand)` method
3. Build query: `SELECT * FROM snippets WHERE id = $1 AND user_id = $2 LIMIT 1`
4. Execute query with parameterized values
5. Return null if not found
6. Transform result to DTO if found

### Step 4: Reuse Authentication Middleware
1. Reuse `src/middleware/auth.middleware.ts` from GET /api/snippets
2. Extract user_id from validated JWT token
3. Attach to request context

### Step 5: Create API Route Handler
1. Create `src/pages/api/snippets/[id].ts` (dynamic route)
2. Apply authentication middleware
3. Extract and validate path parameter `id`
4. Transform to `GetSnippetByIdCommand` with user_id
5. Call `SnippetService.getSnippetById(command)`
6. If null, return 404 NOT_FOUND
7. If found, return 200 OK with snippet data
8. Handle exceptions and map to appropriate status codes

### Step 6: Error Handling Implementation
1. Reuse `src/utils/error-handler.ts`
2. Ensure 404 error message doesn't leak information
3. Add specific handling for UUID validation errors
4. Implement error logging with context

### Step 7: Testing
1. Write unit tests for UUID validation
2. Write unit tests for service layer
3. Write integration tests for API endpoint
4. Test scenarios:
   - Successful retrieval of owned snippet
   - 404 for non-existent snippet
   - 404 for snippet owned by another user (security)
   - 400 for invalid UUID format
   - 401 for missing/invalid token
   - 500 for database errors
5. Security testing:
   - Verify cross-user access is blocked
   - Verify error messages don't leak information
   - Test timing attacks (both 404 scenarios should have similar timing)

### Step 8: Documentation
1. Update API documentation with endpoint details
2. Document security considerations
3. Add example requests/responses
4. Document error scenarios

### Step 9: Deployment Checklist
1. Verify database indexes exist (id primary key, user_id index)
2. Test with valid and invalid UUIDs
3. Verify RLS policies are enabled and working
4. Test authentication flow end-to-end
5. Verify error logging integration
6. Test cross-user access prevention
7. Monitor response times in production
