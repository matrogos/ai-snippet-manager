# REST API Plan

## 1. Resources

- **Users**
  - *Database Table*: `users`
  - Managed through Supabase Auth; operations such as registration, login, and password reset are handled via Supabase Auth API.

- **Snippets**
  - *Database Table*: `snippets`
  - Fields include: `id`, `user_id`, `title`, `code`, `language`, `description`, `ai_description`, `ai_explanation`, `tags`, `is_favorite`, `created_at`, `updated_at`.

- **AI Services**
  - Not stored in database; ephemeral services that process code and return AI-generated content.
  - Three services: Description Generation, Code Explanation, and Tag Suggestion.

## 2. Endpoints

### 2.1. Snippets

- **GET `/api/snippets`**
  - **Description**: Retrieve a paginated, filtered, and sortable list of code snippets for the authenticated user.
  - **Query Parameters**:
    - `page` (default: 1)
    - `limit` (default: 20)
    - `sort` (e.g., `created_at`, `updated_at`, `title`)
    - `order` (`asc` or `desc`, default: `desc`)
    - `language` (optional filter by programming language)
    - `tags` (optional filter by tags, comma-separated)
    - `search` (optional full-text search on title and descriptions)
  - **Response JSON**:
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
  - **Success**: 200 OK
  - **Errors**: 401 Unauthorized if token is invalid.

- **GET `/api/snippets/{id}`**
  - **Description**: Retrieve details for a specific code snippet.
  - **Response JSON**: Complete snippet object including all fields.
  - **Success**: 200 OK
  - **Errors**: 
    - 404 Not Found if snippet doesn't exist or doesn't belong to user
    - 401 Unauthorized

- **POST `/api/snippets`**
  - **Description**: Create a new code snippet.
  - **Request JSON**:
    ```json
    {
      "title": "Array sorting function",
      "code": "function sort(arr) { return arr.sort(); }",
      "language": "javascript",
      "description": "Optional user description",
      "tags": ["algorithm", "sorting"],
      "ai_description": null,
      "ai_explanation": null
    }
    ```
  - **Response JSON**:
    ```json
    {
      "id": "uuid",
      "title": "Array sorting function",
      "code": "function sort(arr) { return arr.sort(); }",
      "language": "javascript",
      "description": "Optional user description",
      "ai_description": null,
      "ai_explanation": null,
      "tags": ["algorithm", "sorting"],
      "is_favorite": false,
      "created_at": "2025-10-15T10:30:00Z",
      "updated_at": "2025-10-15T10:30:00Z"
    }
    ```
  - **Validations**:
    - `title`: Required, maximum 255 characters, non-empty after trim
    - `code`: Required, maximum 50,000 characters, non-empty after trim
    - `language`: Required, must be one of supported languages (javascript, typescript, python, java, csharp, cpp, go, rust, php, ruby, sql, html, css)
    - `description`: Optional, TEXT
    - `tags`: Optional array of strings
  - **Success**: 201 Created
  - **Errors**: 
    - 400 Bad Request for validation errors
    - 401 Unauthorized

- **PUT `/api/snippets/{id}`**
  - **Description**: Update an existing code snippet.
  - **Request JSON**: Partial update supported; include only fields to update.
    ```json
    {
      "title": "Updated title",
      "ai_description": "AI-generated description",
      "tags": ["new", "tags"]
    }
    ```
  - **Response JSON**: Complete updated snippet object.
  - **Validations**: Same as POST for included fields
  - **Success**: 200 OK
  - **Errors**: 
    - 400 Bad Request for validation errors
    - 404 Not Found
    - 401 Unauthorized

- **DELETE `/api/snippets/{id}`**
  - **Description**: Permanently delete a code snippet.
  - **Response JSON**:
    ```json
    {
      "message": "Snippet deleted successfully",
      "id": "uuid"
    }
    ```
  - **Success**: 200 OK
  - **Errors**: 
    - 404 Not Found
    - 401 Unauthorized

### 2.2. AI Services

- **POST `/api/ai/describe`**
  - **Description**: Generate a concise 1-2 sentence description of what the code does using AI.
  - **Request JSON**:
    ```json
    {
      "code": "function factorial(n) { return n <= 1 ? 1 : n * factorial(n-1); }",
      "language": "javascript",
      "snippet_id": "uuid-optional"
    }
    ```
  - **Business Logic**:
    - Validate code is non-empty and language is supported
    - Call OpenAI API with optimized prompt template
    - If `snippet_id` provided, update the snippet's `ai_description` field
    - Response time target: <3 seconds (95th percentile)
  - **Response JSON**:
    ```json
    {
      "description": "This function calculates the factorial of a number using recursion.",
      "snippet_id": "uuid-if-provided"
    }
    ```
  - **Success**: 200 OK
  - **Errors**:
    - 400 Bad Request for invalid input
    - 401 Unauthorized
    - 500 Internal Server Error for AI service failures (with graceful error message)
    - 503 Service Unavailable if OpenAI API is down

- **POST `/api/ai/explain`**
  - **Description**: Generate a detailed, step-by-step explanation of how the code works.
  - **Request JSON**:
    ```json
    {
      "code": "function factorial(n) { return n <= 1 ? 1 : n * factorial(n-1); }",
      "language": "javascript",
      "snippet_id": "uuid-optional"
    }
    ```
  - **Business Logic**:
    - Validate code is non-empty and language is supported
    - Call OpenAI API with explanation-focused prompt
    - If `snippet_id` provided, update the snippet's `ai_explanation` field
    - Response time target: <3 seconds (95th percentile)
  - **Response JSON**:
    ```json
    {
      "explanation": "1. The function checks if n is less than or equal to 1...\n2. If true, it returns 1 (base case)...\n3. Otherwise, it recursively calls itself...",
      "snippet_id": "uuid-if-provided"
    }
    ```
  - **Success**: 200 OK
  - **Errors**: Same as `/api/ai/describe`

- **POST `/api/ai/suggest-tags`**
  - **Description**: Generate 3-5 relevant tags for the code snippet based on AI analysis.
  - **Request JSON**:
    ```json
    {
      "code": "function factorial(n) { return n <= 1 ? 1 : n * factorial(n-1); }",
      "language": "javascript"
    }
    ```
  - **Business Logic**:
    - Validate code is non-empty and language is supported
    - Call OpenAI API to analyze code and suggest tags
    - Return suggestions for user approval (not automatically applied)
    - Response time target: <3 seconds (95th percentile)
  - **Response JSON**:
    ```json
    {
      "tags": ["recursion", "math", "factorial", "algorithm"]
    }
    ```
  - **Success**: 200 OK
  - **Errors**: Same as `/api/ai/describe`

## 3. Authentication and Authorization

- **Mechanism**: JWT-based authentication using Supabase Auth.
- **Process**:
  - Users authenticate via Supabase Auth endpoints:
    - `POST /auth/v1/signup` - User registration
    - `POST /auth/v1/token?grant_type=password` - User login
    - `POST /auth/v1/recover` - Password reset
  - Protected API endpoints require JWT token in `Authorization: Bearer <token>` header
  - Tokens are validated by Supabase client on each request
  - Database-level Row-Level Security (RLS) ensures users can only access their own snippets
  
- **RLS Policies**:
  - All operations on `snippets` table are restricted to rows where `auth.uid() = user_id`
  - This provides defense-in-depth: even if application logic fails, database enforces access control

- **Security Measures**:
  - All API traffic uses HTTPS only
  - Rate limiting: 60 requests per minute per user for AI endpoints
  - OpenAI API key stored as environment variable, never exposed to client
  - Input sanitization to prevent XSS and SQL injection
  - CORS configured for specific allowed origins

## 4. Validation and Business Logic

### 4.1. Snippet Validation Rules

- **Title**:
  - Required field
  - Maximum 255 characters
  - Must not be empty after trimming whitespace
  - Enforced by: Database CHECK constraint + API validation

- **Code**:
  - Required field
  - Maximum 50,000 characters (~50KB)
  - Must not be empty after trimming whitespace
  - Enforced by: Database CHECK constraint + API validation

- **Language**:
  - Required field
  - Must be one of: `javascript`, `typescript`, `python`, `java`, `csharp`, `cpp`, `go`, `rust`, `php`, `ruby`, `sql`, `html`, `css`
  - Maximum 50 characters
  - Enforced by: API validation

- **Description** (optional):
  - TEXT type, no length limit
  - Can be null or empty

- **AI Description** (optional):
  - TEXT type, no length limit
  - Generated by AI or null
  - Can be edited by user

- **AI Explanation** (optional):
  - TEXT type, no length limit
  - Generated by AI or null

- **Tags**:
  - PostgreSQL array of TEXT
  - Default: empty array `{}`
  - Each tag recommended to be 2-30 characters
  - Enforced by: API validation

- **Is Favorite**:
  - BOOLEAN type
  - Default: false

### 4.2. AI Service Business Logic

- **Common Logic for All AI Endpoints**:
  - Validate input parameters (code, language) before calling OpenAI API
  - Implement retry logic with exponential backoff (max 3 retries)
  - Log errors for debugging without exposing internals to user
  - Implement circuit breaker pattern if AI service becomes unavailable
  - Cache responses when appropriate (future optimization)

- **Description Generation**:
  - Prompt: "Analyze this {language} code and provide a concise 1-2 sentence description of what it does."
  - Max tokens: 100
  - Temperature: 0.7
  - If `snippet_id` provided, atomic update of `ai_description` field

- **Code Explanation**:
  - Prompt: "Explain this {language} code step by step. Break down the logic."
  - Max tokens: 500
  - Temperature: 0.7
  - If `snippet_id` provided, atomic update of `ai_explanation` field

- **Tag Suggestion**:
  - Prompt: "Suggest 3-5 relevant tags for this {language} code snippet. Return only comma-separated tags."
  - Max tokens: 50
  - Temperature: 0.5 (lower for consistency)
  - Returns array of strings for user approval
  - Tags not automatically applied to snippet

### 4.3. Search and Filtering Logic

- **Full-text Search**:
  - Uses PostgreSQL `to_tsvector` on title, description, and ai_description
  - Case-insensitive partial matching
  - Ranked by relevance (ts_rank)

- **Language Filter**:
  - Exact match on `language` column
  - Uses B-tree index for performance

- **Tag Filter**:
  - Uses PostgreSQL array operators (`&&` for overlap)
  - GIN index enables efficient array searches
  - Supports multiple tag filtering (OR logic)

- **Pagination**:
  - Default: 20 items per page
  - Maximum: 100 items per page
  - Uses OFFSET and LIMIT with proper indexing

- **Sorting**:
  - Default: `created_at DESC` (newest first)
  - Supported fields: `created_at`, `updated_at`, `title`
  - Uses appropriate indexes for each sort field

### 4.4. Data Integrity

- **Automatic Timestamps**:
  - `created_at`: Set automatically on INSERT by database
  - `updated_at`: Updated automatically on UPDATE by database trigger

- **Cascade Deletion**:
  - When user account deleted, all their snippets automatically deleted
  - Enforced by `ON DELETE CASCADE` foreign key constraint

- **User Isolation**:
  - Row-Level Security ensures complete data isolation
  - Users cannot see, modify, or delete other users' snippets
  - Enforced at database level for defense-in-depth

### 4.5. Error Handling

- **Standard Error Response Format**:
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

- **Error Categories**:
  - `VALIDATION_ERROR` (400): Input validation failed
  - `UNAUTHORIZED` (401): Missing or invalid authentication token
  - `FORBIDDEN` (403): User doesn't have access to resource
  - `NOT_FOUND` (404): Resource doesn't exist or doesn't belong to user
  - `AI_SERVICE_ERROR` (500): OpenAI API call failed
  - `SERVICE_UNAVAILABLE` (503): External service (OpenAI) is down

- **AI Service Fallback**:
  - If AI service fails, return graceful error message
  - Allow user to retry or proceed with manual input
  - Never expose OpenAI API errors directly to users