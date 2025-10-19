# API Endpoint Implementation Plan: DELETE /api/snippets/{id}

## 1. Endpoint Overview

This endpoint permanently deletes a code snippet for the authenticated user. It verifies ownership before performing the deletion and returns a confirmation message. The operation is irreversible and removes the snippet completely from the database through a CASCADE DELETE operation enforced by Row-Level Security policies.

## 2. Request Details

- **HTTP Method**: DELETE
- **URL Structure**: `/api/snippets/{id}`
- **Authentication**: Required (JWT Bearer token)

### Path Parameters

**Required Parameters:**

| Parameter | Type | Validation | Description |
|-----------|------|------------|-------------|
| `id` | string (UUID) | Must be valid UUID v4 format | Unique identifier of the snippet to delete |

**Example Request:**
```
DELETE /api/snippets/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer eyJhbGc...
```

## 3. Used Types

### Path Parameter DTO
```typescript
interface SnippetIdParamDTO {
  id: string; // UUID format
}
```

### Service Command Model
```typescript
interface DeleteSnippetCommand {
  id: string;
  user_id: string;
}
```

### Response DTO
```typescript
interface DeleteSnippetResponseDTO {
  message: string;
  id: string;
}
```

## 4. Response Details

### Success Response (200 OK)
```json
{
  "message": "Snippet deleted successfully",
  "id": "550e8400-e29b-41d4-a716-446655440000"
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
    "message": "Failed to delete snippet"
  }
}
```

## 5. Data Flow

```
1. Client sends DELETE request with snippet ID in path
   ↓
2. API Route Handler receives request
   ↓
3. JWT Middleware validates authentication token
   → Extract user_id from token
   ↓
4. Validation Layer validates path parameter
   → Validate ID is valid UUID format
   ↓
5. Transform to DeleteSnippetCommand
   → Add id from path parameter
   → Add user_id from authenticated user
   ↓
6. SnippetService.deleteSnippet(command)
   → Build DELETE query: DELETE FROM snippets WHERE id = $1 AND user_id = $2
   → Execute query with RLS enforcement
   → Check affected rows count
   ↓
7. Database (PostgreSQL + RLS)
   → RLS enforces user_id = auth.uid() (DELETE policy)
   → Uses indexes: primary key on id + user_id index
   → Returns affected row count
   ↓
8. Service checks result
   → If 0 rows affected, return null (404 error)
   → If 1 row deleted, return success
   ↓
9. Response Builder formats success message
   → Include deleted snippet ID for confirmation
   ↓
10. Return 200 OK with JSON response
```

## 6. Security Considerations

### Authentication
- **JWT Validation**: Every request must include valid Bearer token
- **Token Extraction**: Extract user_id from `auth.uid()` via Supabase
- **Session Validation**: Ensure token is not expired or revoked

### Authorization
- **Ownership Verification**: DELETE query includes `user_id = $user_id` filter
- **Database RLS**: DELETE policy enforces `auth.uid() = user_id`
- **Defense in Depth**: Application-level + database-level checks
- **No Information Leakage**: Return same 404 error whether snippet doesn't exist or belongs to another user

### Input Validation
- **UUID Validation**: Validate ID parameter against UUID v4 format
- **SQL Injection Prevention**: Use parameterized queries
- **Path Traversal Prevention**: UUID validation prevents path manipulation

### Data Security
- **Irreversible Operation**: Deletion is permanent (no recovery)
- **CASCADE Effects**: Consider future references (currently none)
- **Audit Trail**: Consider logging deletions for security/compliance (future enhancement)

### Confirmation and Safety
- **Explicit Operation**: User must explicitly call DELETE endpoint
- **No Bulk Delete**: Only single snippet deletion (prevents accidental mass deletion)
- **Return Confirmation**: Include deleted ID in response for client verification
- **Consider Soft Delete**: Future enhancement for recoverability

### HTTPS Requirement
- **HTTPS Only**: All API traffic must use HTTPS
- **No Sensitive Data**: Response contains only confirmation message

## 7. Error Handling

### Validation Errors (400)
| Scenario | Field | Error Message |
|----------|-------|---------------|
| Invalid UUID format | id | Invalid snippet ID format |
| Malformed ID parameter | id | Snippet ID is required |

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
| Already deleted | NOT_FOUND | Snippet not found | Idempotent operation |

### Server Errors (500)
| Scenario | Error Code | Message |
|----------|------------|---------|
| Database connection failure | DATABASE_ERROR | Failed to connect to database |
| Delete query failure | DATABASE_ERROR | Failed to delete snippet |
| RLS policy violation | FORBIDDEN | Permission denied |
| Unexpected exception | INTERNAL_ERROR | An unexpected error occurred |

### Error Logging
- Log all 500 errors with full stack trace
- Log successful deletions for audit trail (user_id, snippet_id, timestamp)
- Log 404 attempts with user_id and requested snippet_id (for security monitoring)
- Log authentication failures
- Include request ID for error tracking

## 8. Performance Considerations

### Database Optimization
- **Indexes**: Uses primary key on `id` + `user_id` index for ownership check
- **Simple DELETE**: Single-row deletion with indexed columns
- **No SELECT Before DELETE**: Direct DELETE with filters (efficient)
- **Affected Rows Check**: Database returns affected row count (no extra query)

### Response Time Targets
- **95th percentile**: <50ms (simple primary key deletion)
- **99th percentile**: <100ms

### Idempotency
- **Multiple DELETE Calls**: Second call returns 404 (already deleted)
- **Safe to Retry**: Can retry on network errors without side effects

### Bottlenecks
- Minimal bottlenecks expected (single-row indexed deletion)
- Network latency more significant than query time
- RLS policy evaluation (negligible for single row)

## 9. Implementation Steps

### Step 1: Reuse Type Definitions
1. Reuse `SnippetIdParamDTO` from GET endpoint
2. Create `DeleteSnippetCommand` in `src/types/snippet.dto.ts`
3. Create `DeleteSnippetResponseDTO` for success response

### Step 2: Reuse Validation Schema
1. Reuse UUID validation from GET endpoint
2. Use same path parameter validation middleware

### Step 3: Create/Update Service Layer
1. Update `src/services/snippet.service.ts`
2. Implement `deleteSnippet(command: DeleteSnippetCommand)` method
3. Build query: `DELETE FROM snippets WHERE id = $1 AND user_id = $2`
4. Execute DELETE with parameterized values
5. Check affected row count:
   - If 0, return null (not found or not owned)
   - If 1, return success confirmation
6. Return `DeleteSnippetResponseDTO`

### Step 4: Reuse Authentication Middleware
1. Reuse `src/middleware/auth.middleware.ts`
2. Extract user_id from validated JWT token

### Step 5: Create API Route Handler
1. Update `src/pages/api/snippets/[id].ts` (add DELETE handler)
2. Apply authentication middleware
3. Extract and validate path parameter `id`
4. Transform to `DeleteSnippetCommand` with user_id
5. Call `SnippetService.deleteSnippet(command)`
6. If null (not found), return 404 NOT_FOUND
7. If successful, return 200 OK with confirmation message
8. Handle exceptions and map to appropriate status codes

### Step 6: Error Handling Implementation
1. Reuse `src/utils/error-handler.ts`
2. Ensure consistent 404 messaging (don't leak information)
3. Map database errors to user-friendly messages

### Step 7: Add Audit Logging (Optional but Recommended)
1. Create audit logging service
2. Log successful deletions:
   - user_id
   - snippet_id
   - timestamp
   - IP address (if available)
3. Store in separate audit log table or external service
4. Useful for security monitoring and compliance

### Step 8: Testing
1. Write unit tests for service layer
2. Write integration tests for API endpoint
3. Test scenarios:
   - Successful deletion of owned snippet
   - 404 for non-existent snippet
   - 404 for snippet owned by another user (security)
   - 400 for invalid UUID format
   - 401 for missing/invalid token
   - 500 for database errors
   - Idempotency: Delete same snippet twice (second returns 404)
   - RLS policy enforcement
4. Security testing:
   - Verify cross-user deletion is blocked
   - Verify error messages don't leak information
   - Test with various invalid UUIDs

### Step 9: Consider Soft Delete (Future Enhancement)
1. Add `deleted_at` column to snippets table
2. Modify DELETE to UPDATE deleted_at = NOW()
3. Filter out soft-deleted snippets in list/get endpoints
4. Implement permanent delete (admin/cleanup job)
5. Benefits: recoverability, audit trail, compliance

### Step 10: Documentation
1. Update API documentation with endpoint details
2. Document that deletion is permanent
3. Add example requests/responses
4. Document error scenarios
5. Document audit logging (if implemented)

### Step 11: Deployment Checklist
1. Verify database indexes exist (id primary key, user_id index)
2. Verify RLS DELETE policy is enabled
3. Test deletion of owned snippets
4. Test cross-user deletion prevention
5. Verify authentication flow end-to-end
6. Test idempotency (delete twice)
7. Set up audit logging (if implemented)
8. Monitor deletion metrics
9. Set up alerts for unusual deletion patterns
10. Verify error logging integration
