# API Endpoint Implementation Plan: POST /api/ai/suggest-tags

## 1. Endpoint Overview

This endpoint generates 3-5 relevant tags for code snippets using OpenAI's API. Unlike the describe and explain endpoints, this endpoint does NOT automatically update any snippet - it simply returns tag suggestions for the user to review and approve. The user can then manually add the suggested tags to their snippet if desired. The endpoint uses a lower temperature (0.5) for more consistent suggestions and a smaller token limit (50) for efficient, focused responses.

## 2. Request Details

- **HTTP Method**: POST
- **URL Structure**: `/api/ai/suggest-tags`
- **Authentication**: Required (JWT Bearer token)
- **Content-Type**: application/json
- **Rate Limit**: 60 requests per minute per user (shared with other AI endpoints)

### Request Body

**Required Fields:**

| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| `code` | string | Non-empty, max 50,000 chars | Source code to analyze for tags |
| `language` | string | Must be one of 13 supported languages | Programming language of the code |

**No Optional Fields** (Unlike describe/explain, there is no snippet_id parameter)

**Example Request:**
```http
POST /api/ai/suggest-tags
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "code": "function factorial(n) { return n <= 1 ? 1 : n * factorial(n-1); }",
  "language": "javascript"
}
```

## 3. Used Types

### Request DTO
```typescript
interface SuggestTagsRequestDTO {
  code: string;
  language: string;
  // Note: No snippet_id parameter
}
```

### Service Command Model
```typescript
interface SuggestTagsCommand {
  code: string;
  language: string;
  user_id: string; // For rate limiting tracking
}
```

### Response DTO
```typescript
interface SuggestTagsResponseDTO {
  tags: string[]; // Array of 3-5 suggested tags
}
```

### OpenAI Configuration
```typescript
interface OpenAISuggestTagsConfig {
  model: 'gpt-3.5-turbo';
  max_tokens: number;
  temperature: number;
  timeout: number;
}

const SUGGEST_TAGS_CONFIG: OpenAISuggestTagsConfig = {
  model: 'gpt-3.5-turbo',
  max_tokens: 50, // Lowest of all AI endpoints
  temperature: 0.5, // Lower for consistency (vs 0.7 for others)
  timeout: 5000 // 5 seconds
};
```

## 4. Response Details

### Success Response (200 OK)
```json
{
  "tags": ["recursion", "math", "factorial", "algorithm"]
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
    "message": "Validation failed",
    "details": {
      "errors": [
        {
          "field": "code",
          "message": "Code is required and must not be empty"
        },
        {
          "field": "language",
          "message": "Unsupported language"
        }
      ]
    }
  }
}
```

**429 Too Many Requests**
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Maximum 60 requests per minute.",
    "retry_after": 30
  }
}
```

**500 Internal Server Error**
```json
{
  "error": {
    "code": "AI_SERVICE_ERROR",
    "message": "Failed to suggest tags. Please try again."
  }
}
```

**503 Service Unavailable**
```json
{
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "AI service is temporarily unavailable. Please try again later."
  }
}
```

## 5. Data Flow

```
1. Client sends POST request with code and language
   ↓
2. API Route Handler receives request
   ↓
3. Rate Limiting Middleware checks user request count
   → Shared rate limit pool with /api/ai/describe and /api/ai/explain
   → If exceeded, return 429 Too Many Requests
   ↓
4. JWT Middleware validates authentication token
   → Extract user_id from token
   ↓
5. Request Body Parser parses JSON
   → Verify Content-Type: application/json
   ↓
6. Validation Layer validates fields
   → Validate code (required, non-empty, max 50000 chars)
   → Validate language (required, supported)
   → If validation fails, return 400
   ↓
7. Transform to SuggestTagsCommand
   → Add user_id from authenticated user
   → No snippet_id (not supported for this endpoint)
   ↓
8. AIService.suggestTags(command)
   → Build OpenAI prompt:
     "Suggest 3-5 relevant tags for this {language} code snippet.
      Return only comma-separated tags:\n\n{code}"
   → Call OpenAI API with retry logic (max 3 attempts)
     - Retry on: network errors, rate limits, timeouts
     - Exponential backoff: 500ms → 1000ms → 2000ms
   → Extract tags from response
   ↓
9. OpenAI API Processing
   → Model: gpt-3.5-turbo
   → Max tokens: 50 (lowest of all AI endpoints)
   → Temperature: 0.5 (lower for consistency)
   → Timeout: 5 seconds
   → Expected response: "recursion, math, factorial, algorithm"
   ↓
10. Parse and Validate Response
    → Split by comma
    → Trim whitespace
    → Filter empty strings
    → Validate each tag (2-30 chars)
    → Return 3-5 tags (discard extras if more, pad with generic if less)
    ↓
11. Circuit Breaker Check
    → Shared circuit breaker with other AI endpoints
    → If OpenAI failures > threshold, return 503 immediately
    ↓
12. Return 200 OK with tags array
    → User must manually apply tags to snippet (not automatic)
```

## 6. Security Considerations

### Authentication & Authorization
- **JWT Validation**: Required for authentication
- **Shared Rate Limit**: All AI endpoints share the 60 req/min per user limit
- **No Snippet Access**: No snippet_id parameter, so no database queries
- **Lower Cost**: 50 tokens (cheapest AI endpoint)

### API Key Security
- **Reuse**: Same OpenAI API key and security measures as other endpoints

### Input Sanitization
- **Identical to other endpoints**: Same validation and sanitization rules

### Cost Control
- **Lowest Cost**: ~$0.0001 per request (50 tokens)
- **Rate Limiting**: Same 60 req/min limit (shared)
- **Token Limit**: 50 tokens prevents expensive responses
- **Monitoring**: Track usage across all AI endpoints

### Response Validation
- **Tag Format Validation**: Ensure tags meet length requirements (2-30 chars)
- **Sanitization**: Clean up OpenAI response (trim, lowercase)
- **Malicious Tags**: Filter inappropriate content (profanity filter)

### Data Privacy
- **No Storage**: Tags are suggestions only, not stored unless user applies
- **Same Privacy**: Same OpenAI privacy considerations as other endpoints

## 7. Error Handling

### Validation Errors (400)

| Scenario | Field | Error Message |
|----------|-------|---------------|
| Missing code | code | Code is required |
| Empty code | code | Code must not be empty |
| Code too long | code | Code exceeds maximum length of 50000 characters |
| Missing language | language | Language is required |
| Invalid language | language | Unsupported language. Must be one of: javascript, typescript, ... |

### Authentication Errors (401)
Identical to other AI endpoints

### Rate Limiting Errors (429)
Identical to other AI endpoints (shared rate limit pool)

### AI Service Errors (500)

| Scenario | Error Code | Message |
|----------|------------|---------|
| OpenAI API error | AI_SERVICE_ERROR | Failed to suggest tags. Please try again. |
| Timeout | AI_SERVICE_ERROR | Request timeout. Please try again. |
| Invalid API response | AI_SERVICE_ERROR | Failed to process AI response. |
| No tags returned | AI_SERVICE_ERROR | Failed to generate tag suggestions. |
| Invalid tag format | AI_SERVICE_ERROR | Failed to parse tag suggestions. |

### Service Unavailability (503)
Identical to other AI endpoints (shared circuit breaker)

### Error Logging
- Same logging strategy as other AI endpoints
- Additionally log unparseable responses for prompt improvement

## 8. Performance Considerations

### Response Time Targets
- **95th percentile**: <2 seconds (faster than other AI endpoints due to lower tokens)
- **99th percentile**: <4 seconds
- **Timeout**: 10 seconds total (5s OpenAI + 5s overhead)

### OpenAI API Configuration
- **Model**: gpt-3.5-turbo (same as other endpoints)
- **Token Limit**: 50 tokens (lowest, fastest)
- **Temperature**: 0.5 (lower for consistency)
- **Cost**: ~$0.0001 per request (cheapest AI endpoint)

### Retry Strategy
- **Identical to other endpoints**: Same retry configuration and logic

### Circuit Breaker
- **Shared**: Same circuit breaker instance across all AI endpoints

### Response Processing
- **Parsing**: Split comma-separated string into array
- **Validation**: Filter invalid tags
- **Normalization**: Lowercase, trim whitespace, remove duplicates

### Caching (Highly Recommended)
- **High Cache Hit Rate**: Many code patterns have similar tags
- **Cache Key**: SHA-256 hash of (code + language + "suggest-tags")
- **TTL**: 7 days (tags don't change frequently)
- **Significant Cost Savings**: Reduce OpenAI API calls by 50-70%

### Bottlenecks
- **OpenAI API Latency**: 1-3 seconds typical (faster than explain endpoint)
- **Parsing**: Negligible (simple string split)
- **Validation**: Negligible (length checks)

## 9. Implementation Steps

### Step 1: Reuse Infrastructure
1. Reuse OpenAI service from other AI endpoints
2. Reuse rate limiting middleware (shared quota)
3. Reuse circuit breaker (shared instance)
4. Reuse retry logic
5. Reuse authentication middleware

### Step 2: Create Type Definitions
1. Create `SuggestTagsRequestDTO` in `src/types/ai.dto.ts`
2. Create `SuggestTagsCommand`
3. Create `SuggestTagsResponseDTO`
4. Create `SUGGEST_TAGS_CONFIG` constant

### Step 3: Create Validation Schema
1. Create in `src/validators/ai.validator.ts`
2. Simpler than other endpoints (no snippet_id):
   ```typescript
   const suggestTagsSchema = z.object({
     code: z.string().min(1).max(50000),
     language: z.enum(SUPPORTED_LANGUAGES)
     // No snippet_id field
   });
   ```

### Step 4: Extend OpenAI Service
1. Update `src/services/openai.service.ts`
2. Add `suggestTags(code, language)` method:
   ```typescript
   const prompt = `Suggest 3-5 relevant tags for this ${language} code snippet. Return only comma-separated tags:\n\n${code}`;
   const response = await openai.chat.completions.create({
     model: 'gpt-3.5-turbo',
     messages: [{ role: 'user', content: prompt }],
     max_tokens: 50, // Lowest token limit
     temperature: 0.5 // Lower for consistency
   });
   const tagsString = response.choices[0].message.content;
   return parseTags(tagsString); // Parse and validate
   ```
3. Implement `parseTags(response: string): string[]`:
   ```typescript
   function parseTags(response: string): string[] {
     return response
       .split(',')
       .map(tag => tag.trim().toLowerCase())
       .filter(tag => tag.length >= 2 && tag.length <= 30)
       .slice(0, 5); // Max 5 tags
   }
   ```

### Step 5: Add Tag Validation and Normalization
1. Create `src/utils/tag-utils.ts`
2. Implement tag validation:
   - Length: 2-30 characters
   - Characters: alphanumeric, hyphens, underscores only
   - No profanity (optional filter)
3. Implement normalization:
   - Lowercase
   - Trim whitespace
   - Remove duplicates
   - Remove special characters (except hyphen, underscore)

### Step 6: Extend AI Service Layer
1. Update `src/services/ai.service.ts`
2. Implement `suggestTags(command: SuggestTagsCommand)` method
3. Call OpenAI service with retry/circuit breaker
4. Parse and validate response
5. Return 3-5 tags (no database operations)

### Step 7: Create API Route Handler
1. Create `src/pages/api/ai/suggest-tags.ts`
2. Apply shared rate limiting middleware
3. Apply authentication middleware
4. Parse and validate request body (simpler - no snippet_id)
5. Transform to SuggestTagsCommand
6. Call AIService.suggestTags(command)
7. Handle errors (reuse error handler from other endpoints)
8. Return 200 OK with tags array

### Step 8: Implement Caching (Recommended)
1. Create cache layer for tag suggestions
2. Cache key: `tags:${sha256(code + language)}`
3. TTL: 7 days
4. Check cache before calling OpenAI
5. Store successful responses in cache
6. Significant cost savings (50-70% cache hit rate expected)

### Step 9: Add Response Validation
1. Validate tag count (3-5 tags)
2. If fewer than 3, add generic tags based on language
3. If more than 5, return first 5
4. Validate each tag format
5. Remove profanity (if implemented)

### Step 10: Testing
1. Write unit tests for tag parsing
2. Write unit tests for tag validation
3. Write integration tests for API endpoint
4. Test scenarios:
   - Successful tag generation (3-5 tags)
   - Validation errors (empty code, invalid language)
   - Rate limit enforcement (shared)
   - Circuit breaker (shared)
   - Malformed OpenAI responses
   - Profanity filtering (if implemented)
   - Tag normalization (uppercase, whitespace)
   - Duplicate tag removal
7. Test caching functionality

### Step 11: Documentation
1. Update API documentation
2. Document that tags are suggestions only (not auto-applied)
3. Document tag format requirements
4. Document differences from other AI endpoints:
   - No snippet_id parameter
   - Lower token usage (50 vs 100 vs 500)
   - Lower temperature (0.5 vs 0.7)
   - No database updates
5. Add example requests/responses
6. Document caching strategy

### Step 12: Deployment Checklist
1. Verify OpenAI API key is set (reuse from other endpoints)
2. Test with various code samples
3. Verify rate limiting is shared across AI endpoints
4. Test circuit breaker behavior (shared)
5. Monitor tag quality (manual review)
6. Verify caching works correctly
7. Monitor cache hit rate
8. Test tag parsing for various response formats
9. Monitor OpenAI API costs (should be lowest)
10. Set up alerts for parsing failures

### Step 13: Prompt Optimization (Ongoing)
1. Monitor tag quality and relevance
2. A/B test different prompts:
   - Current: "Suggest 3-5 relevant tags..."
   - Alternative: "Analyze this code and provide 3-5 keywords..."
   - Alternative: "What are the main concepts in this code? List 3-5 tags..."
3. Adjust based on user feedback
4. Consider language-specific prompts

### Step 14: Future Enhancements
1. Allow users to provide existing tags for refinement
2. Learn from user tag selections (ML feedback loop)
3. Suggest tags based on popular tags in similar code
4. Add tag categories (e.g., "algorithm", "pattern", "language-feature")
5. Implement tag trending/popularity
