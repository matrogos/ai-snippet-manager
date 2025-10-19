# API Endpoint Implementation Plan: POST /api/snippets

## 1. Endpoint Overview

This endpoint creates a new code snippet for the authenticated user. It performs comprehensive validation on all input fields, automatically assigns ownership to the authenticated user, and returns the complete created snippet including auto-generated fields (ID, timestamps, default values). The endpoint enforces database constraints and business rules to ensure data integrity.

## 2. Request Details

- **HTTP Method**: POST
- **URL Structure**: `/api/snippets`
- **Authentication**: Required (JWT Bearer token)
- **Content-Type**: application/json

### Request Body

**Required Fields:**

| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| `title` | string | Max 255 chars, non-empty after trim | Snippet title |
| `code` | string | Max 50,000 chars, non-empty after trim | Source code content |
| `language` | string | Must be one of 13 supported languages | Programming language |

**Optional Fields:**

| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| `description` | string | TEXT, optional | User-provided description |
| `tags` | string[] | Array of strings, 2-30 chars each recommended | Tags for categorization |
| `ai_description` | string \| null | TEXT, optional | AI-generated description (can be set on create) |
| `ai_explanation` | string \| null | TEXT, optional | AI-generated explanation (can be set on create) |

**Example Request:**
```http
POST /api/snippets
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "title": "Factorial function",
  "code": "function factorial(n) { return n <= 1 ? 1 : n * factorial(n-1); }",
  "language": "javascript",
  "description": "Calculates factorial recursively",
  "tags": ["recursion", "math", "algorithm"]
}
```

## 3. Used Types

### Request DTO
```typescript
interface CreateSnippetRequestDTO {
  title: string;
  code: string;
  language: string;
  description?: string | null;
  tags?: string[];
  ai_description?: string | null;
  ai_explanation?: string | null;
}
```

### Service Command Model
```typescript
interface CreateSnippetCommand {
  user_id: string;
  title: string;
  code: string;
  language: string;
  description?: string | null;
  tags: string[];
  ai_description?: string | null;
  ai_explanation?: string | null;
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

### Validation Constants
```typescript
const SUPPORTED_LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'java',
  'csharp',
  'cpp',
  'go',
  'rust',
  'php',
  'ruby',
  'sql',
  'html',
  'css'
] as const;

const VALIDATION_RULES = {
  TITLE_MAX_LENGTH: 255,
  CODE_MAX_LENGTH: 50000,
  LANGUAGE_MAX_LENGTH: 50,
  TAG_MIN_LENGTH: 2,
  TAG_MAX_LENGTH: 30,
  TAG_MAX_COUNT: 20
};
```

## 4. Response Details

### Success Response (201 Created)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Factorial function",
  "code": "function factorial(n) { return n <= 1 ? 1 : n * factorial(n-1); }",
  "language": "javascript",
  "description": "Calculates factorial recursively",
  "ai_description": null,
  "ai_explanation": null,
  "tags": ["recursion", "math", "algorithm"],
  "is_favorite": false,
  "created_at": "2025-10-19T10:30:00Z",
  "updated_at": "2025-10-19T10:30:00Z"
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

**400 Bad Request - Validation Error**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title must not be empty",
    "details": {
      "field": "title",
      "constraint": "non_empty"
    }
  }
}
```

**400 Bad Request - Multiple Validation Errors**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "errors": [
        {
          "field": "title",
          "message": "Title is required"
        },
        {
          "field": "language",
          "message": "Unsupported language"
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

**500 Internal Server Error**
```json
{
  "error": {
    "code": "DATABASE_ERROR",
    "message": "Failed to create snippet"
  }
}
```

## 5. Data Flow

```
1. Client sends POST request with JSON body
   ↓
2. API Route Handler receives request
   ↓
3. JWT Middleware validates authentication token
   → Extract user_id from token
   ↓
4. Request Body Parser parses JSON
   → Verify Content-Type: application/json
   → Parse request body
   ↓
5. Validation Layer validates all fields
   → Validate title (required, max 255, non-empty after trim)
   → Validate code (required, max 50000, non-empty after trim)
   → Validate language (required, must be in supported list)
   → Validate description (optional, TEXT)
   → Validate tags (optional, array of strings)
   → Validate ai_description (optional)
   → Validate ai_explanation (optional)
   → Collect all validation errors
   → If errors, return 400 with details
   ↓
6. Transform to CreateSnippetCommand
   → Add user_id from authenticated user
   → Set default empty array for tags if not provided
   → Trim whitespace from title and code
   ↓
7. SnippetService.createSnippet(command)
   → Build INSERT query with all fields
   → user_id, title, code, language are set
   → description, tags, ai_description, ai_explanation if provided
   → is_favorite defaults to false (database)
   → created_at, updated_at set by database
   → id generated by database (uuid_generate_v4())
   → Execute INSERT RETURNING *
   ↓
8. Database (PostgreSQL + RLS)
   → RLS enforces user_id = auth.uid() (INSERT policy)
   → CHECK constraints validate title and code non-empty
   → Generate UUID for id
   → Set timestamps
   → Return complete inserted row
   ↓
9. Service transforms DB result to DTO
   → Format timestamps to ISO 8601
   ↓
10. Return 201 Created with Location header
    → Location: /api/snippets/{id}
    → Body: Complete snippet object
```

## 6. Security Considerations

### Authentication
- **JWT Validation**: Every request must include valid Bearer token
- **Token Extraction**: Extract user_id from `auth.uid()` via Supabase
- **Automatic Ownership**: user_id set from token, not from request body
- **Session Validation**: Ensure token is not expired or revoked

### Authorization
- **User Isolation**: Users can only create snippets for themselves
- **RLS INSERT Policy**: Database enforces `auth.uid() = user_id`
- **No User Spoofing**: user_id cannot be set via request body

### Input Validation
- **XSS Prevention**:
  - Store code as-is (developers need exact code)
  - Sanitize description on output (if rendering as HTML)
  - Validate tags to prevent script injection
- **SQL Injection Prevention**: Use parameterized queries for all inserts
- **Code Field**: Don't sanitize code content (preserve exact syntax)
- **Length Limits**: Enforce max lengths to prevent DoS
- **Language Whitelist**: Only accept predefined languages

### Data Security
- **HTTPS Only**: All API traffic must use HTTPS
- **Content-Type Validation**: Only accept application/json
- **Request Size Limit**: Enforce max payload size (60KB recommended)

### Rate Limiting
- **Per-User Rate Limit**: 100 snippet creations per hour
- **Global Rate Limit**: 1000 snippet creations per minute (anti-DoS)
- **Burst Allowance**: Allow short bursts up to 10 requests

## 7. Error Handling

### Validation Errors (400)

| Scenario | Field | Error Message |
|----------|-------|---------------|
| Missing title | title | Title is required |
| Empty title (after trim) | title | Title must not be empty |
| Title too long | title | Title exceeds maximum length of 255 characters |
| Missing code | code | Code is required |
| Empty code (after trim) | code | Code must not be empty |
| Code too long | code | Code exceeds maximum length of 50000 characters |
| Missing language | language | Language is required |
| Invalid language | language | Unsupported language. Must be one of: javascript, typescript, ... |
| Invalid tags format | tags | Tags must be an array of strings |
| Tag too short | tags | Each tag must be at least 2 characters |
| Tag too long | tags | Each tag must not exceed 30 characters |
| Too many tags | tags | Maximum 20 tags allowed |
| Invalid JSON | body | Invalid JSON format |
| Missing Content-Type | headers | Content-Type must be application/json |

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
| Insert query failure | DATABASE_ERROR | Failed to create snippet |
| RLS policy violation | FORBIDDEN | Permission denied |
| Unexpected exception | INTERNAL_ERROR | An unexpected error occurred |

### Error Logging
- Log all 500 errors with full stack trace and request payload (sanitized)
- Log all 400 validation errors for monitoring (aggregate metrics)
- Log authentication failures for security monitoring
- Include request ID for error tracking
- Do NOT log sensitive data (tokens, full code in logs)

## 8. Performance Considerations

### Database Optimization
- **Indexes**: Insertion uses primary key (automatic) and user_id index
- **Batch Inserts**: Not applicable for single snippet creation
- **Connection Pooling**: Use Supabase connection pooling

### Validation Performance
- **Early Validation**: Validate required fields first (fail fast)
- **Regex Performance**: Use efficient regex for validation
- **Schema Validation**: Use compiled validation schemas (Zod)

### Response Time Targets
- **95th percentile**: <200ms
- **99th percentile**: <500ms

### Payload Size
- **Max Request Size**: 60KB (allows 50KB code + metadata)
- **Timeout**: 10 seconds (generous for insert operation)

### Bottlenecks
- JSON parsing for large code payloads
- Database insert with multiple indexes
- RLS policy evaluation (minimal overhead)

## 9. Implementation Steps

### Step 1: Define Type Definitions and Constants
1. Create/update `src/types/snippet.dto.ts`
2. Define `CreateSnippetRequestDTO`
3. Define `CreateSnippetCommand`
4. Create `src/constants/snippet.constants.ts`
5. Define `SUPPORTED_LANGUAGES` array
6. Define `VALIDATION_RULES` constants

### Step 2: Create Validation Schema
1. Install Zod validation library (if not already)
2. Create `src/validators/snippet.validator.ts`
3. Define validation schema for CreateSnippetRequestDTO:
   ```typescript
   const createSnippetSchema = z.object({
     title: z.string().min(1).max(255).transform(s => s.trim()),
     code: z.string().min(1).max(50000).transform(s => s.trim()),
     language: z.enum(SUPPORTED_LANGUAGES),
     description: z.string().nullable().optional(),
     tags: z.array(z.string().min(2).max(30)).max(20).default([]),
     ai_description: z.string().nullable().optional(),
     ai_explanation: z.string().nullable().optional()
   });
   ```
4. Export validation function with detailed error messages

### Step 3: Create/Update Service Layer
1. Update `src/services/snippet.service.ts`
2. Implement `createSnippet(command: CreateSnippetCommand)` method
3. Build INSERT query:
   ```sql
   INSERT INTO snippets (
     user_id, title, code, language, description,
     tags, ai_description, ai_explanation
   ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
   RETURNING *
   ```
4. Execute with parameterized values
5. Transform result to SnippetResponseDTO
6. Handle database errors (constraint violations, RLS)

### Step 4: Reuse Authentication Middleware
1. Reuse `src/middleware/auth.middleware.ts`
2. Extract user_id from validated JWT token
3. Attach to request context

### Step 5: Create API Route Handler
1. Create `src/pages/api/snippets/index.ts` (POST handler)
2. Apply authentication middleware
3. Parse and validate request body
4. Collect validation errors (return all at once if multiple)
5. Transform validated DTO to CreateSnippetCommand
6. Add user_id from authenticated user
7. Call `SnippetService.createSnippet(command)`
8. Handle service errors and map to appropriate status codes
9. Return 201 Created with Location header and snippet data

### Step 6: Add Request Body Size Limit
1. Configure API route to limit request body size
2. Set maximum to 60KB (allows 50KB code + metadata)
3. Return 413 Payload Too Large if exceeded

### Step 7: Error Handling Implementation
1. Reuse/enhance `src/utils/error-handler.ts`
2. Handle Zod validation errors specifically
3. Format validation errors into structured response
4. Map database constraint violations to readable messages
5. Implement error logging with sanitization

### Step 8: Add Rate Limiting
1. Install rate limiting library (e.g., express-rate-limit or custom)
2. Create rate limit middleware
3. Configure per-user limit: 100 requests/hour
4. Configure global limit: 1000 requests/minute
5. Return 429 Too Many Requests when exceeded

### Step 9: Testing
1. Write unit tests for validation schema
2. Write unit tests for service layer
3. Write integration tests for API endpoint
4. Test scenarios:
   - Successful snippet creation with minimal fields
   - Successful creation with all optional fields
   - Validation errors for each field
   - Multiple validation errors simultaneously
   - Title/code exceeding max length
   - Unsupported language
   - Invalid tags format
   - Missing authentication token
   - Expired/invalid token
   - Database errors (simulate)
   - RLS policy enforcement
   - Rate limiting
5. Load testing for performance validation

### Step 10: Documentation
1. Update API documentation with endpoint details
2. Document all validation rules
3. Add example requests and responses
4. Document error scenarios
5. Add language support matrix

### Step 11: Deployment Checklist
1. Verify database constraints are in place
2. Verify RLS INSERT policy is enabled
3. Test with production-like payloads
4. Configure rate limiting
5. Set up error logging and monitoring
6. Test authentication flow end-to-end
7. Verify HTTPS enforcement
8. Monitor response times after deployment
9. Set up alerts for high error rates
