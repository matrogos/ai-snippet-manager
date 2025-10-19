# API Endpoint Implementation Plan: POST /api/ai/explain

## 1. Endpoint Overview

This endpoint generates a detailed, step-by-step explanation of how code works using OpenAI's API. Unlike the describe endpoint which provides a brief summary, this endpoint produces comprehensive explanations that break down the logic, flow, and behavior of the code. Optionally, if a `snippet_id` is provided, the generated explanation is automatically saved to the corresponding snippet's `ai_explanation` field. The endpoint shares the same reliability patterns (retry logic, circuit breaker, rate limiting) as the describe endpoint.

## 2. Request Details

- **HTTP Method**: POST
- **URL Structure**: `/api/ai/explain`
- **Authentication**: Required (JWT Bearer token)
- **Content-Type**: application/json
- **Rate Limit**: 60 requests per minute per user (shared with other AI endpoints)

### Request Body

**Required Fields:**

| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| `code` | string | Non-empty, max 50,000 chars | Source code to explain |
| `language` | string | Must be one of 13 supported languages | Programming language of the code |

**Optional Fields:**

| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| `snippet_id` | string (UUID) | Valid UUID, must belong to authenticated user | If provided, updates snippet's ai_explanation field |

**Example Request (Without Snippet Update):**
```http
POST /api/ai/explain
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "code": "function factorial(n) { return n <= 1 ? 1 : n * factorial(n-1); }",
  "language": "javascript"
}
```

**Example Request (With Snippet Update):**
```http
POST /api/ai/explain
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "code": "function factorial(n) { return n <= 1 ? 1 : n * factorial(n-1); }",
  "language": "javascript",
  "snippet_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

## 3. Used Types

### Request DTO
```typescript
interface ExplainCodeRequestDTO {
  code: string;
  language: string;
  snippet_id?: string; // UUID format
}
```

### Service Command Model
```typescript
interface ExplainCodeCommand {
  code: string;
  language: string;
  user_id: string;
  snippet_id?: string;
}
```

### Response DTO
```typescript
interface ExplainCodeResponseDTO {
  explanation: string;
  snippet_id?: string; // Returned if provided and updated successfully
}
```

### OpenAI Configuration
```typescript
interface OpenAIExplainConfig {
  model: 'gpt-3.5-turbo';
  max_tokens: number;
  temperature: number;
  timeout: number;
}

const EXPLAIN_CONFIG: OpenAIExplainConfig = {
  model: 'gpt-3.5-turbo',
  max_tokens: 500, // Higher than describe (100 tokens)
  temperature: 0.7,
  timeout: 5000 // 5 seconds
};
```

## 4. Response Details

### Success Response (200 OK)
```json
{
  "explanation": "1. The function checks if n is less than or equal to 1 (base case).\n2. If true, it returns 1, stopping the recursion.\n3. Otherwise, it recursively calls itself with n-1 and multiplies the result by n.\n4. This continues until n reaches 1, then the results are multiplied together as the call stack unwinds.\n5. Example: factorial(3) = 3 * factorial(2) = 3 * 2 * factorial(1) = 3 * 2 * 1 = 6.",
  "snippet_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Success Response (Without Snippet Update)
```json
{
  "explanation": "1. The function checks if n is less than or equal to 1 (base case).\n2. If true, it returns 1, stopping the recursion.\n3. Otherwise, it recursively calls itself with n-1 and multiplies the result by n.\n4. This continues until n reaches 1, then the results are multiplied together as the call stack unwinds.\n5. Example: factorial(3) = 3 * factorial(2) = 3 * 2 * factorial(1) = 3 * 2 * 1 = 6."
}
```

### Error Responses

All error responses are identical to the describe endpoint:

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
        }
      ]
    }
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
    "message": "Failed to generate explanation. Please try again."
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
   → Shared rate limit pool with /api/ai/describe and /api/ai/suggest-tags
   → If exceeded, return 429 Too Many Requests
   ↓
4. JWT Middleware validates authentication token
   → Extract user_id from token
   ↓
5. Request Body Parser parses JSON
   → Verify Content-Type: application/json
   ↓
6. Validation Layer validates all fields
   → Validate code (required, non-empty, max 50000 chars)
   → Validate language (required, supported)
   → Validate snippet_id (optional, valid UUID)
   → If validation fails, return 400
   ↓
7. If snippet_id provided: verify ownership
   → Query: SELECT id FROM snippets WHERE id = $1 AND user_id = $2
   → If not found, return 404
   ↓
8. Transform to ExplainCodeCommand
   → Add user_id from authenticated user
   ↓
9. AIService.explainCode(command)
   → Build OpenAI prompt:
     "Explain this {language} code step by step. Break down the logic:\n\n{code}"
   → Call OpenAI API with retry logic (max 3 attempts)
     - Retry on: network errors, rate limits, timeouts
     - Exponential backoff: 500ms → 1000ms → 2000ms
   → Extract explanation from response
   ↓
10. If snippet_id provided: update snippet atomically
    → UPDATE snippets SET ai_explanation = $1 WHERE id = $2 AND user_id = $3
    → Handle update errors
    ↓
11. OpenAI API Processing
    → Model: gpt-3.5-turbo
    → Max tokens: 500 (5x more than describe)
    → Temperature: 0.7
    → Timeout: 5 seconds
    ↓
12. Circuit Breaker Check
    → Shared circuit breaker with describe endpoint
    → If OpenAI failures > threshold, return 503 immediately
    → Reset circuit after success streak
    ↓
13. Return 200 OK with explanation
    → Include snippet_id if provided
```

## 6. Security Considerations

### Authentication & Authorization
- **Identical to describe endpoint**: JWT validation, rate limiting, snippet ownership verification
- **Shared Rate Limit**: All AI endpoints share the 60 req/min per user limit
- **Higher Cost**: 500 tokens vs 100 tokens (5x more expensive per request)

### API Key Security
- **Reuse**: Same OpenAI API key and security measures as describe endpoint
- **Cost Monitoring**: More critical due to higher token usage

### Input Sanitization
- **Identical to describe endpoint**: Same validation and sanitization rules

### Cost Control
- **Higher Per-Request Cost**: ~$0.001 per request vs ~$0.0002 for describe
- **Rate Limiting**: More critical to prevent abuse (same 60 req/min limit)
- **Token Limit**: 500 tokens prevents runaway costs
- **Monitoring**: Alert on unusually high token usage

### Data Privacy
- **Identical to describe endpoint**: Same privacy considerations

## 7. Error Handling

### Validation Errors (400)
Identical to describe endpoint

### Authentication Errors (401)
Identical to describe endpoint

### Authorization Errors (404)
Identical to describe endpoint

### Rate Limiting Errors (429)
Identical to describe endpoint (shared rate limit pool)

### AI Service Errors (500)
Identical to describe endpoint

### Service Unavailability (503)
Identical to describe endpoint (shared circuit breaker)

### Error Logging
- Same logging strategy as describe endpoint
- Additionally log token usage for cost monitoring

## 8. Performance Considerations

### Response Time Targets
- **95th percentile**: <3 seconds (same as describe, per API plan requirement)
- **99th percentile**: <5 seconds
- **Timeout**: 10 seconds total (5s OpenAI + 5s overhead)
- **Note**: May be slightly slower due to higher token count

### OpenAI API Configuration
- **Model**: gpt-3.5-turbo (same as describe)
- **Token Limit**: 500 tokens (5x more than describe)
- **Temperature**: 0.7 (balanced creativity and consistency)
- **Cost**: ~$0.001 per request (gpt-3.5-turbo pricing)

### Retry Strategy
- **Identical to describe endpoint**: Same retry configuration and logic

### Circuit Breaker
- **Shared**: Same circuit breaker instance as describe endpoint
- **Failure Threshold**: 5 consecutive failures across all AI endpoints
- **Benefit**: Protects entire AI service, not just one endpoint

### Caching (Future Enhancement)
- Similar to describe endpoint
- Cache key: SHA-256 hash of (code + language + "explain")
- Higher value due to higher cost per request

### Bottlenecks
- **OpenAI API Latency**: 2-5 seconds typical (may be longer due to more tokens)
- **Token Generation**: 500 tokens takes longer than 100 tokens
- **Network Latency**: Same as describe
- **Database Update**: Same as describe (minimal)

## 9. Implementation Steps

### Step 1: Reuse Infrastructure
1. Reuse OpenAI service from describe endpoint
2. Reuse rate limiting middleware (shared quota)
3. Reuse circuit breaker (shared instance)
4. Reuse retry logic
5. Reuse authentication middleware

### Step 2: Create Type Definitions
1. Create `ExplainCodeRequestDTO` in `src/types/ai.dto.ts`
2. Create `ExplainCodeCommand`
3. Create `ExplainCodeResponseDTO`
4. Create `EXPLAIN_CONFIG` constant

### Step 3: Create Validation Schema
1. Create in `src/validators/ai.validator.ts`
2. Schema identical to describe endpoint:
   ```typescript
   const explainCodeSchema = z.object({
     code: z.string().min(1).max(50000),
     language: z.enum(SUPPORTED_LANGUAGES),
     snippet_id: z.string().uuid().optional()
   });
   ```

### Step 4: Extend OpenAI Service
1. Update `src/services/openai.service.ts`
2. Add `generateExplanation(code, language)` method:
   ```typescript
   const prompt = `Explain this ${language} code step by step. Break down the logic:\n\n${code}`;
   const response = await openai.chat.completions.create({
     model: 'gpt-3.5-turbo',
     messages: [{ role: 'user', content: prompt }],
     max_tokens: 500, // Higher than describe
     temperature: 0.7
   });
   return response.choices[0].message.content;
   ```
3. Reuse error handling from describe implementation

### Step 5: Extend AI Service Layer
1. Update `src/services/ai.service.ts`
2. Implement `explainCode(command: ExplainCodeCommand)` method
3. Flow identical to describe, but call `generateExplanation` instead
4. If snippet_id provided, update `ai_explanation` field (not `ai_description`)

### Step 6: Create API Route Handler
1. Create `src/pages/api/ai/explain.ts`
2. Apply shared rate limiting middleware
3. Apply authentication middleware
4. Parse and validate request body
5. If snippet_id provided, verify ownership
6. Transform to ExplainCodeCommand
7. Call AIService.explainCode(command)
8. Handle errors (reuse error handler from describe)
9. Return 200 OK with explanation

### Step 7: Share Rate Limiter
1. Ensure rate limiter is shared across all AI endpoints
2. Use single Redis key per user for all AI operations
3. Key format: `ratelimit:ai:${user_id}`
4. Increment on any AI endpoint call

### Step 8: Share Circuit Breaker
1. Use single circuit breaker instance for all AI endpoints
2. Track OpenAI API health across describe, explain, suggest-tags
3. Open circuit affects all endpoints simultaneously
4. Close circuit benefits all endpoints

### Step 9: Add Cost Monitoring
1. Track token usage per request
2. Log actual tokens used (from OpenAI response)
3. Calculate cost: tokens * $0.002 / 1000 (gpt-3.5-turbo input pricing)
4. Aggregate daily costs per user
5. Alert on unusually high costs

### Step 10: Testing
1. Reuse test infrastructure from describe endpoint
2. Write unit tests for explain service
3. Write integration tests for API endpoint
4. Test scenarios identical to describe endpoint
5. Additionally test:
   - Longer explanations (verify 500 token limit)
   - Cost calculations
   - Token usage logging
6. Verify rate limit is shared with describe endpoint
7. Verify circuit breaker is shared

### Step 11: Documentation
1. Update API documentation
2. Document differences from describe endpoint:
   - Longer, more detailed explanations
   - Higher token usage (500 vs 100)
   - Higher cost per request
3. Document shared rate limit with other AI endpoints
4. Add example requests/responses
5. Document prompt structure

### Step 12: Deployment Checklist
1. Verify OpenAI API key is set (reuse from describe)
2. Test with various code samples
3. Verify rate limiting is shared across AI endpoints
4. Test circuit breaker behavior (shared)
5. Monitor OpenAI API costs (should be ~5x describe endpoint)
6. Verify error logging
7. Test snippet update functionality (ai_explanation field)
8. Monitor response times (may be slightly longer than describe)
9. Verify token usage logging
10. Set up cost alerts (more critical due to higher usage)

### Step 13: Optimization Considerations
1. Consider offering multiple explanation levels:
   - Brief (200 tokens, cheaper)
   - Detailed (500 tokens, current)
   - Comprehensive (1000 tokens, most expensive)
2. Implement caching (high value due to high cost)
3. Consider batch processing for multiple snippets
4. Monitor and optimize prompts to reduce token usage
