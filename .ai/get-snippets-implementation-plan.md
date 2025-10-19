# API Endpoint Implementation Plan: GET /api/snippets

## 1. Endpoint Overview

This endpoint retrieves a paginated, filtered, and sortable list of code snippets for the authenticated user. It supports advanced querying capabilities including full-text search, language filtering, tag filtering, and custom sorting options. The endpoint ensures users can only access their own snippets through JWT authentication and Row-Level Security.

## 2. Request Details

- **HTTP Method**: GET
- **URL Structure**: `/api/snippets`
- **Authentication**: Required (JWT Bearer token)

### Query Parameters

**Optional Parameters:**

| Parameter | Type | Default | Validation | Description |
|-----------|------|---------|------------|-------------|
| `page` | integer | 1 | Must be positive integer ≥ 1 | Current page number |
| `limit` | integer | 20 | Must be 1-100 | Number of items per page |
| `sort` | string | created_at | Must be one of: created_at, updated_at, title | Field to sort by |
| `order` | string | desc | Must be: asc or desc | Sort direction |
| `language` | string | - | Must be one of 13 supported languages | Filter by programming language |
| `tags` | string | - | Comma-separated tag list | Filter by tags (OR logic) |
| `search` | string | - | Non-empty string | Full-text search query |

**Example Request:**
```
GET /api/snippets?page=1&limit=20&sort=created_at&order=desc&language=javascript&tags=algorithm,sorting&search=factorial
Authorization: Bearer eyJhbGc...
```

## 3. Used Types

### Query DTO
```typescript
interface SnippetListQueryDTO {
  page?: number;
  limit?: number;
  sort?: 'created_at' | 'updated_at' | 'title';
  order?: 'asc' | 'desc';
  language?: string;
  tags?: string;
  search?: string;
}
```

### Response DTOs
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

interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

interface PaginatedSnippetsResponseDTO {
  data: SnippetResponseDTO[];
  pagination: PaginationMetadata;
}
```

### Service Command Model
```typescript
interface GetSnippetsCommand {
  user_id: string;
  page: number;
  limit: number;
  sort: string;
  order: 'asc' | 'desc';
  language?: string;
  tags?: string[];
  search?: string;
}
```

## 4. Response Details

### Success Response (200 OK)
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Array sorting function",
      "code": "function sort(arr) {...}",
      "language": "javascript",
      "description": "Custom sorting implementation",
      "ai_description": "This function sorts an array using quicksort algorithm",
      "ai_explanation": null,
      "tags": ["algorithm", "sorting"],
      "is_favorite": false,
      "created_at": "2025-10-15T10:30:00Z",
      "updated_at": "2025-10-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
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

**400 Bad Request**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameters",
    "details": {
      "field": "limit",
      "constraint": "must_be_between_1_and_100"
    }
  }
}
```

**500 Internal Server Error**
```json
{
  "error": {
    "code": "DATABASE_ERROR",
    "message": "Failed to retrieve snippets"
  }
}
```

## 5. Data Flow

```
1. Client sends GET request with query parameters
   ↓
2. API Route Handler receives request
   ↓
3. JWT Middleware validates authentication token
   → Extract user_id from token
   ↓
4. Validation Layer validates query parameters
   → Parse and validate page, limit, sort, order
   → Validate language against supported list
   → Parse tags from comma-separated string
   → Sanitize search query
   ↓
5. SnippetService.getSnippets(command)
   → Build PostgreSQL query with filters
   → Apply user_id filter (security)
   → Apply language filter (if provided)
   → Apply tags filter using array operators (if provided)
   → Apply full-text search using to_tsvector (if provided)
   → Apply sorting
   → Calculate offset: (page - 1) * limit
   → Execute count query for total
   → Execute data query with LIMIT/OFFSET
   ↓
6. Database (PostgreSQL + RLS)
   → RLS enforces user_id = auth.uid()
   → Uses indexes: idx_snippets_user_id, idx_snippets_language,
     idx_snippets_tags, idx_snippets_created_at, idx_snippets_search
   → Returns filtered and paginated results + total count
   ↓
7. Service transforms DB results to DTOs
   ↓
8. Response Builder constructs paginated response
   → Calculate total_pages = ceil(total / limit)
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
- **User Isolation**: Database RLS ensures `user_id = auth.uid()`
- **Defense in Depth**: Application-level user_id filter + database RLS
- **No Cross-User Access**: Users cannot access other users' snippets

### Input Validation
- **SQL Injection Prevention**: Use parameterized queries for all inputs
- **XSS Prevention**: Sanitize search query (though stored data already sanitized)
- **DoS Prevention**: Enforce maximum limit of 100 items per page
- **Type Validation**: Validate all query parameters against expected types

### Data Security
- **HTTPS Only**: All API traffic must use HTTPS
- **No Sensitive Data**: Response doesn't include user passwords or tokens
- **Minimal Data Exposure**: Only return fields specified in API contract

## 7. Error Handling

### Validation Errors (400)
| Scenario | Error Code | Message |
|----------|------------|---------|
| Invalid page number | VALIDATION_ERROR | Page must be a positive integer |
| Invalid limit | VALIDATION_ERROR | Limit must be between 1 and 100 |
| Invalid sort field | VALIDATION_ERROR | Sort must be one of: created_at, updated_at, title |
| Invalid order | VALIDATION_ERROR | Order must be asc or desc |
| Invalid language | VALIDATION_ERROR | Unsupported language |

### Authentication Errors (401)
| Scenario | Error Code | Message |
|----------|------------|---------|
| Missing token | UNAUTHORIZED | Missing authentication token |
| Invalid token | UNAUTHORIZED | Invalid authentication token |
| Expired token | UNAUTHORIZED | Authentication token expired |

### Server Errors (500)
| Scenario | Error Code | Message |
|----------|------------|---------|
| Database connection failure | DATABASE_ERROR | Failed to connect to database |
| Query execution failure | DATABASE_ERROR | Failed to retrieve snippets |
| Unexpected exception | INTERNAL_ERROR | An unexpected error occurred |

### Error Logging
- Log all 500 errors with full stack trace
- Log authentication failures for security monitoring
- Do NOT log sensitive data (tokens, user IDs in plaintext)
- Include request ID for error tracking

## 8. Performance Considerations

### Database Optimization
- **Indexes**: Utilize existing indexes for optimal query performance
  - B-tree: user_id, language, created_at
  - GIN: tags (array search), full-text search
- **Query Optimization**: Use EXPLAIN ANALYZE to verify index usage
- **Connection Pooling**: Use Supabase connection pooling

### Pagination
- **Offset vs Cursor**: Current implementation uses OFFSET/LIMIT (acceptable for <10k records)
- **Count Query**: Execute separate COUNT query for total (cache if needed)
- **Default Limit**: Keep default at 20 for optimal response time

### Caching Strategy (Future Enhancement)
- Cache popular queries (e.g., first page, no filters)
- Use Redis with TTL of 60 seconds
- Invalidate cache on snippet creation/update/delete

### Response Time Targets
- **95th percentile**: <200ms (without search)
- **95th percentile**: <500ms (with full-text search)
- **99th percentile**: <1000ms

### Bottlenecks
- Full-text search with large result sets
- Multiple tags filter with large datasets
- COUNT query on large tables (consider caching)

## 9. Implementation Steps

### Step 1: Create Type Definitions
1. Create `src/types/snippet.dto.ts` for DTOs
2. Define `SnippetListQueryDTO`
3. Define `SnippetResponseDTO`
4. Define `PaginatedSnippetsResponseDTO`
5. Define `GetSnippetsCommand`

### Step 2: Create Validation Schema
1. Install validation library (Zod recommended for TypeScript)
2. Create `src/validators/snippet.validator.ts`
3. Define validation schema for query parameters
4. Implement supported languages constant
5. Create validation middleware

### Step 3: Create Service Layer
1. Create/update `src/services/snippet.service.ts`
2. Implement `getSnippets(command: GetSnippetsCommand)` method
3. Build dynamic query with filters:
   - Base query: `SELECT * FROM snippets WHERE user_id = $1`
   - Add language filter if provided
   - Add tags filter using `tags && $tags` (array overlap)
   - Add full-text search using `to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || COALESCE(ai_description, '')) @@ plainto_tsquery('english', $search)`
   - Add sorting with validated field and order
   - Add LIMIT and OFFSET
4. Execute COUNT query for total records
5. Transform database results to DTOs

### Step 4: Create Authentication Middleware
1. Create `src/middleware/auth.middleware.ts`
2. Extract JWT token from Authorization header
3. Validate token using Supabase client
4. Extract user_id from token payload
5. Attach user to request context
6. Return 401 if validation fails

### Step 5: Create API Route Handler
1. Create `src/pages/api/snippets/index.ts`
2. Apply authentication middleware
3. Extract and validate query parameters
4. Transform validated params to `GetSnippetsCommand`
5. Call `SnippetService.getSnippets(command)`
6. Handle service errors and map to appropriate status codes
7. Return formatted response

### Step 6: Error Handling Implementation
1. Create `src/utils/error-handler.ts`
2. Define standard error response format
3. Create error mapping for different error types
4. Implement error logging utility
5. Add error context (request ID, timestamp)

### Step 7: Testing
1. Write unit tests for validation logic
2. Write unit tests for service layer
3. Write integration tests for API endpoint
4. Test scenarios:
   - Successful retrieval with various filters
   - Pagination edge cases (page 0, negative page, limit > 100)
   - Invalid query parameters
   - Missing authentication token
   - Expired/invalid token
   - Empty results
   - Database errors
5. Performance testing with large datasets

### Step 8: Documentation
1. Update API documentation with examples
2. Document query parameter combinations
3. Add troubleshooting guide for common errors
4. Document performance characteristics

### Step 9: Deployment Checklist
1. Verify database indexes exist
2. Test with production-like data volume
3. Configure rate limiting (if not done globally)
4. Set up monitoring and alerting
5. Verify HTTPS enforcement
6. Test error logging integration
7. Verify RLS policies are enabled
