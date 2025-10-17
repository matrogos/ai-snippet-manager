# Technical Architecture Document (TAD)
## AI Code Snippet Manager

**Version:** 1.0  
**Date:** October 11, 2025  
**Status:** Draft  
**Author:** Development Team

---

## 1. System Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Astro + React Frontend                   │  │
│  │                  (TypeScript)                         │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTPS
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌─────────────┐
│   Supabase   │  │  OpenAI API  │  │   Vercel    │
│     Auth     │  │  (GPT-3.5)   │  │  (Hosting)  │
└──────┬───────┘  └──────────────┘  └─────────────┘
       │
       ▼
┌──────────────┐
│  PostgreSQL  │
│  (Supabase)  │
└──────────────┘
```

### 1.2 System Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend** | Astro + React + TypeScript | User interface, client-side logic |
| **Authentication** | Supabase Auth | User management, session handling |
| **Database** | PostgreSQL (Supabase) | Data persistence, user snippets |
| **AI Service** | OpenAI API (GPT-3.5-turbo) | Code analysis, description generation |
| **Hosting** | Vercel | Application deployment, CDN |
| **CI/CD** | GitHub Actions | Automated testing, deployment |

---

## 2. Technology Stack

### 2.1 Frontend Stack

#### Astro (Static Site Generator)
**Why chosen:**
- ⚡ Zero JavaScript by default (fast page loads)
- 🔧 Partial hydration (only interactive components load JS)
- 🎯 Perfect for content-heavy pages (snippet listing)
- 📦 Built-in routing and layouts

**Alternatives considered:**
- Next.js: Too heavy, unnecessary SSR overhead
- Vite + React: More manual configuration needed
- SvelteKit: Smaller ecosystem, less TypeScript support

#### React (UI Components)
**Why chosen:**
- 🎨 Component reusability
- 📚 Large ecosystem (syntax highlighting libs, etc.)
- 💪 TypeScript support
- 🔄 State management (useState, useContext)

**Usage pattern:**
- Islands Architecture: Only forms and interactive widgets use React
- Astro pages handle routing and static content

#### TypeScript
**Why chosen:**
- 🛡️ Type safety reduces runtime errors
- 📖 Better IDE support and autocomplete
- 🔍 Easier refactoring
- 📝 Self-documenting code

#### Tailwind CSS
**Why chosen:**
- ⚡ Utility-first approach (fast development)
- 📦 Purged CSS (small bundle size)
- 🎨 Consistent design system
- 📱 Responsive design utilities

### 2.2 Backend Services

#### Supabase (BaaS - Backend as a Service)
**Why chosen:**
- 🔐 Built-in authentication (email/password, OAuth ready)
- 🗄️ PostgreSQL database (familiar SQL)
- 🔒 Row-Level Security (RLS) out of the box
- 🆓 Generous free tier
- ⚡ Real-time capabilities (future feature)

**What we use:**
- Authentication API
- PostgreSQL database
- Auto-generated REST API
- Storage (future: for profile images)

#### OpenAI API
**Why chosen:**
- 🤖 Best-in-class code understanding
- 💰 Cost-effective (GPT-3.5-turbo)
- 📚 Well-documented API
- 🔄 Reliable uptime

**Model selection:**
- **GPT-3.5-turbo** for MVP (cost: ~$0.002/1K tokens)
- GPT-4 as upgrade path for better quality

### 2.3 Development Tools

| Tool | Purpose |
|------|---------|
| **Prism.js** | Syntax highlighting (13 languages) |
| **Playwright** | E2E testing |
| **GitHub Actions** | CI/CD pipeline |
| **ESLint + Prettier** | Code quality, formatting |
| **Vercel** | Zero-config deployment |

---

## 3. Component Architecture

### 3.1 Directory Structure

```
ai-snippet-manager/
├── src/
│   ├── components/          # React components
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── ResetPassword.tsx
│   │   ├── snippets/
│   │   │   ├── SnippetCard.tsx
│   │   │   ├── SnippetForm.tsx
│   │   │   ├── SnippetDetail.tsx
│   │   │   ├── CodeEditor.tsx
│   │   │   └── SnippetList.tsx
│   │   ├── ai/
│   │   │   ├── AIPanel.tsx
│   │   │   ├── DescriptionGenerator.tsx
│   │   │   ├── CodeExplainer.tsx
│   │   │   └── TagSuggester.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Modal.tsx
│   │       └── LoadingSpinner.tsx
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   ├── AuthLayout.astro
│   │   └── DashboardLayout.astro
│   ├── pages/
│   │   ├── index.astro          # Landing page
│   │   ├── login.astro
│   │   ├── register.astro
│   │   ├── dashboard.astro
│   │   ├── snippet/
│   │   │   ├── [id].astro       # View snippet
│   │   │   ├── new.astro        # Create snippet
│   │   │   └── edit/[id].astro  # Edit snippet
│   │   └── api/                 # API routes
│   │       ├── ai/
│   │       │   ├── describe.ts
│   │       │   ├── explain.ts
│   │       │   └── suggest-tags.ts
│   ├── lib/
│   │   ├── supabase.ts          # Supabase client
│   │   ├── openai.ts            # OpenAI integration
│   │   ├── db.ts                # Database helpers
│   │   └── utils.ts             # Utilities
│   ├── types/
│   │   ├── snippet.ts
│   │   ├── user.ts
│   │   └── api.ts
│   ├── styles/
│   │   └── global.css
│   └── config/
│       ├── languages.ts         # Supported languages
│       └── constants.ts
├── tests/
│   └── e2e/
│       ├── auth.spec.ts
│       ├── snippet-crud.spec.ts
│       └── ai-features.spec.ts
├── .github/
│   └── workflows/
│       └── ci.yml
├── public/
│   └── favicon.ico
├── .env.example
├── .env.local
├── astro.config.mjs
├── tailwind.config.cjs
├── tsconfig.json
├── playwright.config.ts
├── package.json
└── README.md
```

### 3.2 Component Patterns

#### 3.2.1 Astro Pages (Routing)
- **Static pages:** Landing, login, register
- **Dynamic pages:** Snippet detail, edit
- **Protected pages:** Dashboard, snippet management

**Example pattern:**
```typescript
// src/pages/dashboard.astro
---
import { getUser } from '../lib/supabase';

const user = await getUser(Astro.request);
if (!user) return Astro.redirect('/login');

const snippets = await getSnippets(user.id);
---

<DashboardLayout>
  <SnippetList snippets={snippets} client:load />
</DashboardLayout>
```

#### 3.2.2 React Components (Interactive Islands)
- **Forms:** SnippetForm, LoginForm
- **Interactive UI:** AIPanel, CodeEditor
- **Lists:** SnippetList (with search/filter)

**Example pattern:**
```typescript
// src/components/snippets/SnippetForm.tsx
export default function SnippetForm({ snippet }: Props) {
  const [code, setCode] = useState(snippet?.code || '');
  const [language, setLanguage] = useState('javascript');
  
  const handleSubmit = async (e: FormEvent) => {
    // Submit to Supabase
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

---

## 4. Data Architecture

### 4.1 Database Schema

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (managed by Supabase Auth)
-- auth.users (id, email, encrypted_password, created_at, etc.)

-- Snippets table
CREATE TABLE snippets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  code TEXT NOT NULL,
  language VARCHAR(50) NOT NULL,
  description TEXT,
  ai_description TEXT,
  ai_explanation TEXT,
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT title_not_empty CHECK (LENGTH(TRIM(title)) > 0),
  CONSTRAINT code_not_empty CHECK (LENGTH(TRIM(code)) > 0)
);

-- Indexes for performance
CREATE INDEX idx_snippets_user_id ON snippets(user_id);
CREATE INDEX idx_snippets_language ON snippets(language);
CREATE INDEX idx_snippets_tags ON snippets USING GIN(tags);
CREATE INDEX idx_snippets_created_at ON snippets(created_at DESC);
CREATE INDEX idx_snippets_title_search ON snippets USING GIN(to_tsvector('english', title));

-- Full-text search index
CREATE INDEX idx_snippets_search ON snippets 
  USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || COALESCE(ai_description, '')));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_snippets_updated_at
  BEFORE UPDATE ON snippets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 4.2 Row-Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE snippets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own snippets
CREATE POLICY "Users can view own snippets"
  ON snippets
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own snippets
CREATE POLICY "Users can insert own snippets"
  ON snippets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own snippets
CREATE POLICY "Users can update own snippets"
  ON snippets
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own snippets
CREATE POLICY "Users can delete own snippets"
  ON snippets
  FOR DELETE
  USING (auth.uid() = user_id);
```

### 4.3 Data Types

```typescript
// src/types/snippet.ts
export interface Snippet {
  id: string;
  user_id: string;
  title: string;
  code: string;
  language: string;
  description?: string;
  ai_description?: string;
  ai_explanation?: string;
  tags: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSnippetInput {
  title: string;
  code: string;
  language: string;
  description?: string;
  tags?: string[];
}

export interface UpdateSnippetInput extends Partial<CreateSnippetInput> {
  id: string;
}
```

---

## 5. Authentication Flow

### 5.1 Authentication Sequence

```
User                  Frontend              Supabase Auth         Database
  |                      |                       |                    |
  |--- Fill form ------->|                       |                    |
  |                      |--- signUp() --------->|                    |
  |                      |                       |--- Create user --->|
  |                      |                       |<--- User ID -------|
  |                      |<--- JWT token --------|                    |
  |<--- Redirect --------|                       |                    |
  |    to dashboard      |                       |                    |
  |                      |                       |                    |
  |--- Request page ---->|                       |                    |
  |                      |--- Verify JWT ------->|                    |
  |                      |<--- User info --------|                    |
  |                      |--- Query snippets ------------------->     |
  |                      |<--- Snippets (RLS filtered) ----------|    |
  |<--- Render page -----|                       |                    |
```

### 5.2 Session Management

**Client-side:**
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY
);

// Get current user
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Login
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

// Logout
export async function signOut() {
  await supabase.auth.signOut();
}
```

**Server-side (Astro middleware):**
```typescript
// src/middleware.ts
export async function onRequest({ request, redirect }, next) {
  const protectedRoutes = ['/dashboard', '/snippet'];
  const path = new URL(request.url).pathname;
  
  if (protectedRoutes.some(route => path.startsWith(route))) {
    const user = await getCurrentUser(request);
    if (!user) return redirect('/login');
  }
  
  return next();
}
```

---

## 6. AI Integration Architecture

### 6.1 OpenAI Integration Pattern

```
Frontend Component     API Route          OpenAI API        Database
      |                   |                   |                |
      |--- Request ------>|                   |                |
      |   (code, lang)    |                   |                |
      |                   |--- Validate ----->|                |
      |                   |    input          |                |
      |                   |                   |                |
      |                   |--- Build prompt ->|                |
      |                   |--- API call ----->|                |
      |                   |                   |--- Process --->|
      |                   |<--- Response -----|                |
      |                   |--- Save result ------------->      |
      |                   |<--- Confirmation -----------|      |
      |<--- Return -------|                   |                |
      |    AI result      |                   |                |
```

### 6.2 OpenAI API Implementation

```typescript
// src/lib/openai.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.OPENAI_API_KEY,
});

export async function generateDescription(
  code: string,
  language: string
): Promise<string> {
  const prompt = `Analyze this ${language} code and provide a concise 1-2 sentence description of what it does. Focus on the main functionality.

Code:
${code}

Description:`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 100,
    temperature: 0.7,
  });

  return completion.choices[0].message.content || '';
}

export async function explainCode(
  code: string,
  language: string
): Promise<string> {
  const prompt = `Explain this ${language} code step by step. Break down the logic and explain what each important section does.

Code:
${code}

Explanation:`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 500,
    temperature: 0.7,
  });

  return completion.choices[0].message.content || '';
}

export async function suggestTags(
  code: string,
  language: string
): Promise<string[]> {
  const prompt = `Suggest 3-5 relevant tags for this ${language} code snippet. Tags should describe the functionality, patterns, or technologies used. Return only comma-separated tags.

Code:
${code}

Tags:`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 50,
    temperature: 0.5,
  });

  const tagsString = completion.choices[0].message.content || '';
  return tagsString.split(',').map(tag => tag.trim()).filter(Boolean);
}
```

### 6.3 API Routes

```typescript
// src/pages/api/ai/describe.ts
import type { APIRoute } from 'astro';
import { generateDescription } from '../../../lib/openai';
import { supabase } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { code, language, snippetId } = await request.json();
    
    // Validate input
    if (!code || !language) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
      });
    }
    
    // Generate description
    const description = await generateDescription(code, language);
    
    // Save to database if snippetId provided
    if (snippetId) {
      await supabase
        .from('snippets')
        .update({ ai_description: description })
        .eq('id', snippetId);
    }
    
    return new Response(JSON.stringify({ description }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'AI processing failed' }), {
      status: 500,
    });
  }
};
```

### 6.4 Error Handling & Retry Logic

```typescript
// src/lib/openai.ts (extended)
export async function callOpenAIWithRetry<T>(
  apiCall: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on client errors (4xx)
      if (error.status && error.status >= 400 && error.status < 500) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError!;
}
```

---

## 7. Security Architecture

### 7.1 Security Layers

```
┌─────────────────────────────────────────┐
│     Transport Layer Security (HTTPS)    │
├─────────────────────────────────────────┤
│     Authentication (Supabase JWT)       │
├─────────────────────────────────────────┤
│     Authorization (RLS Policies)        │
├─────────────────────────────────────────┤
│     Input Validation & Sanitization     │
├─────────────────────────────────────────┤
│     API Key Protection (Env Vars)       │
└─────────────────────────────────────────┘
```

### 7.2 Security Measures

#### 7.2.1 Authentication
- **JWT tokens** for session management
- **HTTP-only cookies** (Supabase handles this)
- **Token expiration:** 7 days
- **Refresh tokens** for long-lived sessions

#### 7.2.2 Authorization
- **Row-Level Security (RLS)** in PostgreSQL
- Users can only access their own snippets
- Server-side validation of user permissions

#### 7.2.3 API Security
- **Environment variables** for API keys
- **Rate limiting** on AI endpoints (60 req/min per user)
- **Request validation** on all endpoints
- **CORS configuration** for API routes

#### 7.2.4 Input Sanitization
```typescript
// src/lib/utils.ts
export function sanitizeInput(input: string): string {
  // Remove potential XSS vectors
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .trim();
}

export function validateSnippetInput(data: CreateSnippetInput): boolean {
  return (
    data.title.length > 0 &&
    data.title.length <= 255 &&
    data.code.length > 0 &&
    data.code.length <= 50000 &&
    SUPPORTED_LANGUAGES.includes(data.language)
  );
}
```

### 7.3 Environment Variables

```bash
# .env.example
# Supabase
PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJxxx...

# OpenAI
OPENAI_API_KEY=sk-xxx...

# App
PUBLIC_APP_URL=http://localhost:4321
NODE_ENV=development
```

**Security notes:**
- `PUBLIC_*` vars are exposed to client
- Private keys (OPENAI_API_KEY) only on server
- Never commit `.env` files to git

---

## 8. Performance Optimization

### 8.1 Frontend Optimization

#### Code Splitting
- **Astro Islands:** Only interactive components load JS
- **Lazy loading:** Snippet list loads incrementally
- **Route-based splitting:** Each page is a separate bundle

#### Asset Optimization
- **Tailwind purge:** Remove unused CSS (~95% reduction)
- **Image optimization:** Use Astro's `<Image>` component
- **Font subsetting:** Load only used characters

#### Caching Strategy
```typescript
// Cache Prism.js language definitions
const languageCache = new Map();

export function loadLanguage(lang: string) {
  if (languageCache.has(lang)) {
    return languageCache.get(lang);
  }
  
  const grammar = loadPrismLanguage(lang);
  languageCache.set(lang, grammar);
  return grammar;
}
```

### 8.2 Database Optimization

#### Indexing Strategy
- **Primary indexes:** user_id, language, created_at
- **GIN indexes:** tags (array search), full-text search
- **Partial indexes:** `WHERE is_favorite = true` (future)

#### Query Optimization
```typescript
// Efficient pagination
export async function getSnippets(userId: string, page = 1, limit = 20) {
  const { data, error } = await supabase
    .from('snippets')
    .select('id, title, language, tags, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);
  
  return data;
}

// Avoid N+1 queries - fetch related data in one query
```

### 8.3 AI Request Optimization

#### Prompt Optimization
- **Concise prompts:** Reduce token usage
- **Temperature tuning:** Lower temp for consistent results
- **Max tokens limit:** Cap response length

#### Request Batching (Future)
```typescript
// Instead of 3 separate calls, batch AI requests
export async function analyzeSnippet(code: string, language: string) {
  const prompt = `Analyze this ${language} code and provide:
1. Description (1-2 sentences)
2. Explanation (step by step)
3. Tags (3-5 keywords)

Code:
${code}`;

  // Single API call returns all three
}
```

---

## 9. Deployment Architecture

### 9.1 CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test:e2e
      
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### 9.2 Deployment Flow

```
Developer         GitHub            GitHub Actions      Vercel
    |                |                     |               |
    |--- git push -->|                     |               |
    |                |--- Trigger -------->|               |
    |                |                     |--- Build ----->|
    |                |                     |--- Run tests ->|
    |                |                     |<--- Pass ------|
    |                |                     |--- Deploy ---->|
    |                |                     |<--- Success ---|
    |<--- Notify ----|<--- Status ---------|               |
```

### 9.3 Environment Configuration

| Environment | Branch | URL | Purpose |
|-------------|--------|-----|---------|
| **Production** | `main` | https://ai-snippets.vercel.app | Live app |
| **Staging** | `develop` | https://ai-snippets-dev.vercel.app | Testing |
| **Preview** | PR branches | https://ai-snippets-pr-*.vercel.app | PR reviews |

### 9.4 Monitoring & Logging

```typescript
// src/lib/monitoring.ts
export function logError(error: Error, context: Record<string, any>) {
  console.error('Error:', error);
  console.error('Context:', context);
  
  // In production, send to monitoring service
  if (import.meta.env.PROD) {
    // Sentry, LogRocket, or similar
    // sentryClient.captureException(error, { extra: context });
  }
}

export function trackEvent(event: string, properties?: Record<string, any>) {
  // Analytics tracking
  if (import.meta.env.PROD) {
    // analytics.track(event, properties);
  }
}
```

---

## 10. Testing Strategy

### 10.1 Testing Pyramid

```
         /\
        /  \
       / E2E \          ← 20% (Critical user flows)
      /-------\
     /  Integ  \        ← 30% (API + DB integration)
    /-----------\
   /    Unit     \      ← 50% (Component logic)
  /---------------\
```

### 10.2 E2E Tests (Playwright)

```typescript
// tests/e2e/snippet-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Snippet Management Flow', () => {
  test('user can create, edit, and delete snippet', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Navigate to new snippet
    await page.goto('/snippet/new');
    
    // Fill form
    await page.fill('[name="title"]', 'Test Snippet');
    await page.fill('[name="code"]', 'console.log("Hello");');
    await page.selectOption('[name="language"]', 'javascript');
    
    // Generate AI description
    await page.click('button:has-text("Generate Description")');
    await expect(page.locator('[data-testid="ai-description"]')).toBeVisible();
    
    // Save snippet
    await page.click('button:has-text("Save Snippet")');
    await expect(page).toHaveURL(/\/snippet\/[a-f0-9-]+/);
    
    // Edit snippet
    await page.click('button:has-text("Edit")');
    await page.fill('[name="title"]', 'Updated Snippet');
    await page.click('button:has-text("Save")');
    await expect(page.locator('h1')).toContainText('Updated Snippet');
    
    // Delete snippet
    await page.click('button:has-text("Delete")');
    await page.click('button:has-text("Confirm")');
    await expect(page).toHaveURL('/dashboard');
  });
});
```

### 10.3 Test Coverage Goals

| Type | Coverage | Focus Areas |
|------|----------|-------------|
| **E2E** | 100% of critical paths | Auth, CRUD, AI features |
| **Integration** | 80% | API routes, DB operations |
| **Unit** | 70% | Utilities, helpers, validation |

---

## 11. Scalability Considerations

### 11.1 Current Architecture Limits

| Resource | Limit | Mitigation |
|----------|-------|------------|
| **Supabase Free Tier** | 500MB DB, 2GB bandwidth | Upgrade to Pro ($25/mo) |
| **OpenAI Rate Limit** | 60 req/min | Implement queuing system |
| **Vercel Free Tier** | 100GB bandwidth | Upgrade to Pro ($20/mo) |

### 11.2 Future Scaling Path

**Phase 1: MVP (0-100 users)**
- Current architecture sufficient
- Supabase free tier
- OpenAI pay-as-you-go

**Phase 2: Growth (100-1,000 users)**
- Upgrade Supabase to Pro
- Implement caching (Redis)
- Add CDN for static assets
- Database read replicas

**Phase 3: Scale (1,000+ users)**
- Microservices architecture
- Dedicated AI service
- Message queue (RabbitMQ/SQS)
- Multiple database shards

---

## 12. Risks and Mitigation

### 12.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **OpenAI API downtime** | Medium | High | Cache responses, retry logic, fallback to manual input |
| **Supabase outage** | Low | Critical | Regular backups, monitoring, status page |
| **High AI costs** | Medium | Medium | Rate limiting, use GPT-3.5 instead of GPT-4 |
| **Performance degradation** | Low | Medium | Pagination, indexing, lazy loading |

### 12.2 Mitigation Strategies

```typescript
// AI fallback pattern
async function generateDescriptionSafe(code: string, language: string) {
  try {
    return await generateDescription(code, language);
  } catch (error) {
    logError(error, { code, language });
    
    // Fallback: return empty and allow manual input
    return null;
  }
}
```

---

## 13. Appendix

### 13.1 Supported Programming Languages

```typescript
// src/config/languages.ts
export const SUPPORTED_LANGUAGES = [
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
  'css',
] as const;

export type Language = typeof SUPPORTED_LANGUAGES[number];
```

### 13.2 API Response Formats

```typescript
// Success response
{
  "success": true,
  "data": {
    "description": "This function calculates the factorial of a number."
  }
}

// Error response
{
  "success": false,
  "error": {
    "code": "AI_PROCESSING_FAILED",
    "message": "Unable to generate description",
    "details": "OpenAI API timeout"
  }
}
```

---

**Document Status:** Draft  
**Last Updated:** October 11, 2025  
**Next Review:** Before development start