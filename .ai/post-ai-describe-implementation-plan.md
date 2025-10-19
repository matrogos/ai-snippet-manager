# API Endpoint Implementation Plan: POST /api/ai/describe

## 1. Endpoint Overview

This endpoint generates a concise 1-2 sentence description of code using OpenAI's API. It analyzes the provided code and language to produce a clear, human-readable summary of what the code does. Optionally, if a `snippet_id` is provided, the generated description is automatically saved to the corresponding snippet's `ai_description` field. The endpoint implements retry logic, circuit breaker patterns, and rate limiting to ensure reliability and cost control.

## 2. Request Details

- **HTTP Method**: POST
- **URL Structure**: `/api/ai/describe`
- **Authentication**: Required (JWT Bearer token)
- **Content-Type**: application/json
- **Rate Limit**: 60 requests per minute per user

### Request Body

**Required Fields:**

| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| `code` | string | Non-empty, max 50,000 chars | Source code to analyze |
| `language` | string | Must be one of 13 supported languages | Programming language of the code |

**Optional Fields:**

| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| `snippet_id` | string (UUID) | Valid UUID, must belong to authenticated user | If provided, updates snippet's ai_description field |

**Example Request (Without Snippet Update):**
```http
POST /api/ai/describe
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "code": "function factorial(n) { return n <= 1 ? 1 : n * factorial(n-1); }",
  "language": "javascript"
}
```

**Example Request (With Snippet Update):**
```http
POST /api/ai/describe
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
interface DescribeCodeRequestDTO {
  code: string;
  language: string;
  snippet_id?: string; // UUID format
}
```

### Service Command Model
```typescript
interface DescribeCodeCommand {
  code: string;
  language: string;
  user_id: string;
  snippet_id?: string;
}
```

### Response DTO
```typescript
interface DescribeCodeResponseDTO {
  description: string;
  snippet_id?: string; // Returned if provided and updated successfully
}
```

### OpenAI Configuration
```typescript
interface OpenAIConfig {
  model: 'gpt-4' | 'gpt-3.5-turbo';
  max_tokens: number;
  temperature: number;
  timeout: number;
}

const DESCRIBE_CONFIG: OpenAIConfig = {
  model: 'gpt-3.5-turbo',
  max_tokens: 100,
  temperature: 0.7,
  timeout: 5000 // 5 seconds
};
```

### Retry Configuration
```typescript
interface RetryConfig {
  max_retries: number;
  initial_delay_ms: number;
  max_delay_ms: number;
  backoff_multiplier: number;
}

const RETRY_CONFIG: RetryConfig = {
  max_retries: 3,
  initial_delay_ms: 500,
  max_delay_ms: 4000,
  backoff_multiplier: 2
};
```

## 4. Response Details

### Success Response (200 OK)
```json
{
  "description": "This function calculates the factorial of a number using recursion.",
  "snippet_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Success Response (Without Snippet Update)
```json
{
  "description": "This function calculates the factorial of a number using recursion."
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

**404 Not Found (Invalid snippet_id)**
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
    "message": "Failed to generate description. Please try again."
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
8. Transform to DescribeCodeCommand
   → Add user_id from authenticated user
   ↓
9. AIService.describeCode(command)
   → Build OpenAI prompt:
     "Analyze this {language} code and provide a concise 1-2 sentence
      description of what it does:\n\n{code}"
   → Call OpenAI API with retry logic (max 3 attempts)
     - Retry on: network errors, rate limits, timeouts
     - Exponential backoff: 500ms → 1000ms → 2000ms
   → Extract description from response
   ↓
10. If snippet_id provided: update snippet atomically
    → UPDATE snippets SET ai_description = $1 WHERE id = $2 AND user_id = $3
    → Handle update errors
    ↓
11. OpenAI API Processing
    → Model: gpt-3.5-turbo
    → Max tokens: 100
    → Temperature: 0.7
    → Timeout: 5 seconds
    ↓
12. Circuit Breaker Check
    → If OpenAI failures > threshold, return 503 immediately
    → Reset circuit after success streak
    ↓
13. Return 200 OK with description
    → Include snippet_id if provided
```

## 6. Security Considerations

### Authentication & Authorization
- **JWT Validation**: Every request requires valid Bearer token
- **User Rate Limiting**: 60 requests per minute per user (prevents abuse)
- **Global Rate Limiting**: 1000 requests per minute system-wide (prevents DoS)
- **Snippet Ownership**: If snippet_id provided, verify it belongs to authenticated user

### API Key Security
- **Environment Variable**: Store OpenAI API key in environment (never in code)
- **Never Expose**: API key never sent to client
- **Rotation**: Support key rotation without code changes
- **Monitoring**: Alert on unusual API usage patterns

### Input Sanitization
- **Code Sanitization**: Escape special characters for OpenAI prompt
- **Prompt Injection Prevention**: Use structured prompts, don't concatenate directly
- **Length Limits**: Enforce 50KB code limit (prevents expensive API calls)
- **Language Whitelist**: Only accept predefined languages

### Cost Control
- **Rate Limiting**: Prevents excessive API costs
- **Max Tokens**: Limit response length (100 tokens ≈ $0.0002 per request)
- **Timeout**: 5-second timeout prevents hanging requests
- **Circuit Breaker**: Stop calling API if it's failing (prevents cost accumulation)

### Data Privacy
- **HTTPS Only**: All API traffic encrypted
- **No Code Storage**: Code sent to OpenAI but not stored by us
- **OpenAI Privacy**: Review OpenAI data retention policy
- **User Consent**: Document AI processing in terms of service

## 7. Error Handling

### Validation Errors (400)

| Scenario | Field | Error Message |
|----------|-------|---------------|
| Missing code | code | Code is required |
| Empty code | code | Code must not be empty |
| Code too long | code | Code exceeds maximum length of 50000 characters |
| Missing language | language | Language is required |
| Invalid language | language | Unsupported language. Must be one of: javascript, typescript, ... |
| Invalid snippet_id format | snippet_id | Invalid snippet ID format |

### Authentication Errors (401)
| Scenario | Error Code | Message |
|----------|------------|---------|
| Missing token | UNAUTHORIZED | Missing authentication token |
| Invalid token | UNAUTHORIZED | Invalid authentication token |
| Expired token | UNAUTHORIZED | Authentication token expired |

### Authorization Errors (404)
| Scenario | Error Code | Message |
|----------|------------|---------|
| snippet_id doesn't exist | NOT_FOUND | Snippet not found |
| snippet_id belongs to another user | NOT_FOUND | Snippet not found |

### Rate Limiting Errors (429)
| Scenario | Error Code | Message |
|----------|------------|---------|
| User rate limit exceeded | RATE_LIMIT_EXCEEDED | Rate limit exceeded. Maximum 60 requests per minute. |
| Global rate limit exceeded | RATE_LIMIT_EXCEEDED | System is experiencing high load. Please try again later. |

### AI Service Errors (500)
| Scenario | Error Code | Message |
|----------|------------|---------|
| OpenAI API error | AI_SERVICE_ERROR | Failed to generate description. Please try again. |
| Timeout | AI_SERVICE_ERROR | Request timeout. Please try again. |
| Invalid API response | AI_SERVICE_ERROR | Failed to process AI response. |
| Snippet update failure | DATABASE_ERROR | Description generated but failed to update snippet. |

### Service Unavailability (503)
| Scenario | Error Code | Message |
|----------|------------|---------|
| Circuit breaker open | SERVICE_UNAVAILABLE | AI service is temporarily unavailable. Please try again later. |
| OpenAI API down | SERVICE_UNAVAILABLE | AI service is temporarily unavailable. Please try again later. |

### Error Logging
- Log all OpenAI API errors with request ID (not full code)
- Log rate limit violations for monitoring
- Log authentication failures
- Log circuit breaker state changes
- Include user_id, language, code length (not full code)
- Never log OpenAI API key

## 8. Performance Considerations

### Response Time Targets
- **95th percentile**: <3 seconds (per API plan requirement)
- **99th percentile**: <5 seconds
- **Timeout**: 10 seconds total (5s OpenAI + 5s overhead)

### OpenAI API Optimization
- **Model Selection**: gpt-3.5-turbo (faster and cheaper than gpt-4)
- **Token Limit**: 100 tokens max (keeps responses concise and costs low)
- **Temperature**: 0.7 (balanced creativity and consistency)
- **Streaming**: Not needed for short responses

### Retry Strategy
- **Max Retries**: 3 attempts
- **Exponential Backoff**: 500ms → 1s → 2s
- **Retry Conditions**: Network errors, rate limits, timeouts
- **No Retry**: 4xx errors (except 429), invalid requests

### Circuit Breaker
- **Failure Threshold**: 5 consecutive failures
- **Open Duration**: 60 seconds
- **Half-Open Test**: Single request to test recovery
- **Success Threshold**: 3 consecutive successes to close

### Caching (Future Enhancement)
- Cache responses for identical code+language combinations
- Use Redis with TTL of 1 hour
- Cache key: SHA-256 hash of (code + language)
- Significant cost savings for duplicate requests

### Bottlenecks
- OpenAI API latency (2-5 seconds typical)
- Network latency to OpenAI servers
- Rate limiting delays
- Database update for snippet (minimal)

## 9. Implementation Steps

### Step 1: Install Dependencies
1. Install OpenAI SDK: `npm install openai`
2. Install retry library: `npm install axios-retry`
3. Install rate limiting: `npm install express-rate-limit` or `npm install @upstash/ratelimit`
4. Add circuit breaker: `npm install opossum`

### Step 2: Configure Environment Variables
1. Add to `.env`:
   ```
   OPENAI_API_KEY=sk-...
   OPENAI_MODEL=gpt-3.5-turbo
   OPENAI_MAX_TOKENS=100
   OPENAI_TEMPERATURE=0.7
   OPENAI_TIMEOUT=5000
   AI_RATE_LIMIT_PER_MIN=60
   ```
2. Validate environment variables on startup

### Step 3: Create Type Definitions
1. Create `src/types/ai.dto.ts`
2. Define `DescribeCodeRequestDTO`
3. Define `DescribeCodeCommand`
4. Define `DescribeCodeResponseDTO`
5. Define `OpenAIConfig` and `RetryConfig`

### Step 4: Create Validation Schema
1. Create `src/validators/ai.validator.ts`
2. Define validation schema:
   ```typescript
   const describeCodeSchema = z.object({
     code: z.string().min(1).max(50000),
     language: z.enum(SUPPORTED_LANGUAGES),
     snippet_id: z.string().uuid().optional()
   });
   ```

### Step 5: Create OpenAI Service
1. Create `src/services/openai.service.ts`
2. Initialize OpenAI client with API key
3. Implement `generateDescription(code, language)` method:
   ```typescript
   const prompt = `Analyze this ${language} code and provide a concise 1-2 sentence description of what it does:\n\n${code}`;
   const response = await openai.chat.completions.create({
     model: 'gpt-3.5-turbo',
     messages: [{ role: 'user', content: prompt }],
     max_tokens: 100,
     temperature: 0.7
   });
   return response.choices[0].message.content;
   ```
4. Add error handling for OpenAI API errors
5. Sanitize code for prompt (escape special characters)

### Step 6: Add Retry Logic
1. Wrap OpenAI calls with retry mechanism
2. Configure exponential backoff
3. Retry on: network errors, 429 rate limits, timeouts
4. Don't retry on: 400 Bad Request, 401 Unauthorized
5. Log retry attempts

### Step 7: Implement Circuit Breaker
1. Create `src/middleware/circuit-breaker.middleware.ts`
2. Track OpenAI API failure rate
3. Open circuit after 5 consecutive failures
4. Keep open for 60 seconds
5. Test with single request (half-open)
6. Close after 3 consecutive successes
7. Return 503 when circuit is open

### Step 8: Add Rate Limiting
1. Create `src/middleware/rate-limit.middleware.ts`
2. Implement per-user rate limiting (60 req/min)
3. Implement global rate limiting (1000 req/min)
4. Use Redis for distributed rate limiting (if multiple servers)
5. Return 429 with Retry-After header

### Step 9: Create AI Service Layer
1. Create `src/services/ai.service.ts`
2. Implement `describeCode(command: DescribeCodeCommand)` method
3. Call OpenAI service (with retry + circuit breaker)
4. If snippet_id provided:
   - Verify ownership
   - Update snippet atomically
   - Handle update errors
5. Return description + snippet_id (if applicable)

### Step 10: Create API Route Handler
1. Create `src/pages/api/ai/describe.ts`
2. Apply rate limiting middleware
3. Apply authentication middleware
4. Parse and validate request body
5. If snippet_id provided, verify ownership
6. Transform to DescribeCodeCommand
7. Call AIService.describeCode(command)
8. Handle errors and map to status codes
9. Return 200 OK with description

### Step 11: Error Handling Implementation
1. Create `src/utils/ai-error-handler.ts`
2. Map OpenAI API errors to user-friendly messages
3. Never expose OpenAI error details to users
4. Log detailed errors for debugging
5. Implement graceful degradation

### Step 12: Add Monitoring
1. Log OpenAI API response times
2. Track success/failure rates
3. Monitor cost per request
4. Alert on high failure rates
5. Track rate limit violations
6. Monitor circuit breaker state

### Step 13: Testing
1. Write unit tests for OpenAI service
2. Write unit tests for AI service layer
3. Write integration tests for API endpoint
4. Mock OpenAI API responses
5. Test scenarios:
   - Successful description generation
   - With snippet_id update
   - Without snippet_id
   - Validation errors
   - Invalid snippet_id
   - Rate limit exceeded
   - OpenAI API errors
   - Timeouts
   - Circuit breaker behavior
   - Retry logic
6. Load testing for performance validation

### Step 14: Documentation
1. Update API documentation
2. Document rate limits
3. Document OpenAI model and parameters
4. Add example requests/responses
5. Document error scenarios
6. Add cost estimation guide

### Step 15: Deployment Checklist
1. Verify OpenAI API key is set
2. Test with various code samples
3. Verify rate limiting works
4. Test circuit breaker behavior
5. Monitor OpenAI API costs
6. Set up cost alerts
7. Verify error logging
8. Test snippet update functionality
9. Monitor response times
10. Set up performance alerts
