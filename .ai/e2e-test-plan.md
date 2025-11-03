# End-to-End (E2E) Testing Plan for AI Snippet Manager

**Document Version:** 1.0
**Last Updated:** 2025-01-20
**Status:** Ready for Implementation

---

## Overview

This document provides a comprehensive plan for implementing end-to-end (E2E) tests using Playwright. E2E tests validate complete user workflows from the browser perspective, ensuring the entire application stack works correctly together (frontend + backend + database + authentication).

**Key Focus:**
- Real user interactions in a browser
- Critical user workflows from start to finish
- Cross-browser compatibility
- Visual and functional correctness
- Authentication flows

---

## Current Playwright Setup

✅ **Already Configured**

```typescript
// playwright.config.ts (existing)
testDir: './tests/e2e'
baseURL: 'http://localhost:4321'
webServer: Auto-starts dev server
projects: ['chromium']
```

**What's Missing:**
- Test files (0 tests currently)
- Test utilities and helpers
- Authentication helpers
- Test fixtures
- Page Object Models (optional but recommended)

---

## E2E Testing Strategy

### **Test Pyramid Position**

```
     /\
    /E2E\  ← 15-20 tests (slow, high-value)
   /____\
  /Integration\  150 tests (medium, API-level)
 /__________\
/    Unit    \ 179 tests ✅ (fast, many)
/_____________\
```

**E2E Test Philosophy:**
- **Few but critical** - Test main user journeys only
- **Slow but comprehensive** - Full stack validation
- **High maintenance cost** - Keep tests stable and valuable
- **User-centric** - Test what users actually do

---

## Test Infrastructure Setup

### Directory Structure

```
tests/
└── e2e/
    ├── auth/
    │   ├── login.spec.ts
    │   └── register.spec.ts
    ├── snippets/
    │   ├── create.spec.ts
    │   ├── view.spec.ts
    │   ├── edit.spec.ts
    │   └── list.spec.ts
    ├── ai/
    │   └── ai-features.spec.ts
    ├── fixtures/
    │   ├── auth.ts
    │   └── test-data.ts
    └── helpers/
        ├── auth-helpers.ts
        └── db-helpers.ts
```

### Test User Setup

**Create dedicated test user:**

```typescript
// tests/e2e/fixtures/auth.ts
export const TEST_USER = {
  email: 'e2e-test@example.com',
  password: 'TestPassword123!',
  // Created manually in Supabase or via setup script
};

export const TEST_USER_2 = {
  email: 'e2e-test-2@example.com',
  password: 'TestPassword456!',
  // For multi-user scenarios
};
```

### Authentication Helpers

```typescript
// tests/e2e/helpers/auth-helpers.ts
import { Page } from '@playwright/test';
import { TEST_USER } from '../fixtures/auth';

export async function login(page: Page) {
  await page.goto('/login');
  await page.fill('[name="email"]', TEST_USER.email);
  await page.fill('[name="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
}

export async function loginWithStoredSession(page: Page) {
  // Reuse session storage to speed up tests
  const context = page.context();
  await context.addCookies(/* saved cookies */);
}
```

### Database Cleanup Helpers

```typescript
// tests/e2e/helpers/db-helpers.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // Service key for admin access
);

export async function cleanupTestSnippets(userId: string) {
  await supabase
    .from('snippets')
    .delete()
    .eq('user_id', userId);
}

export async function createTestSnippet(userId: string, data: any) {
  const { data: snippet } = await supabase
    .from('snippets')
    .insert({ ...data, user_id: userId })
    .select()
    .single();
  return snippet;
}
```

---

## E2E Test Candidates by Priority

### 🔴 Priority 0: Critical User Journeys (Must Have)

#### 1. Authentication Flow

**File:** `tests/e2e/auth/login.spec.ts`

**User Story:** "As a user, I want to log in to access my snippets"

**Test Scenarios:**

```typescript
import { test, expect } from '@playwright/test';

test.describe('User Login', () => {
  test('successful login with valid credentials', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Fill login form
    await page.fill('[name="email"]', 'e2e-test@example.com');
    await page.fill('[name="password"]', 'TestPassword123!');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify redirect to dashboard
    await expect(page).toHaveURL('/dashboard');

    // Verify user is logged in
    await expect(page.locator('text=e2e-test@example.com')).toBeVisible();
  });

  test('shows error message for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[name="email"]', 'invalid@example.com');
    await page.fill('[name="password"]', 'WrongPassword');
    await page.click('button[type="submit"]');

    // Should stay on login page
    await expect(page).toHaveURL('/login');

    // Should show error message
    await expect(page.locator('.error, [role="alert"]')).toBeVisible();
  });

  test('validates email format', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[name="email"]', 'not-an-email');
    await page.fill('[name="password"]', 'password123');

    // HTML5 validation or custom error
    const emailInput = page.locator('[name="email"]');
    await expect(emailInput).toHaveAttribute('type', 'email');
  });

  test('shows error when fields are empty', async ({ page }) => {
    await page.goto('/login');
    await page.click('button[type="submit"]');

    // Should show validation errors
    await expect(page.locator('.error, [role="alert"]')).toBeVisible();
  });

  test('redirects logged-in users away from login page', async ({ page }) => {
    // First login
    await login(page);

    // Try to access login page
    await page.goto('/login');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });
});
```

**Estimated Effort:** 2-3 hours

---

#### 2. User Registration

**File:** `tests/e2e/auth/register.spec.ts`

**User Story:** "As a new user, I want to create an account"

**Test Scenarios:**

```typescript
test.describe('User Registration', () => {
  test('successful registration creates account', async ({ page }) => {
    await page.goto('/register');

    // Use unique email to avoid conflicts
    const uniqueEmail = `test-${Date.now()}@example.com`;

    await page.fill('[name="email"]', uniqueEmail);
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.fill('[name="confirmPassword"]', 'TestPassword123!');

    await page.click('button[type="submit"]');

    // Should redirect to dashboard or login
    await expect(page).toHaveURL(/\/(dashboard|login)/);
  });

  test('shows error for existing email', async ({ page }) => {
    await page.goto('/register');

    // Use existing test user email
    await page.fill('[name="email"]', 'e2e-test@example.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.fill('[name="confirmPassword"]', 'TestPassword123!');

    await page.click('button[type="submit"]');

    // Should show error
    await expect(page.locator('.error, [role="alert"]')).toContainText(/already exists|taken/i);
  });

  test('validates password confirmation match', async ({ page }) => {
    await page.goto('/register');

    await page.fill('[name="email"]', 'new@example.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.fill('[name="confirmPassword"]', 'DifferentPassword!');

    await page.click('button[type="submit"]');

    // Should show password mismatch error
    await expect(page.locator('.error, [role="alert"]')).toContainText(/match/i);
  });

  test('validates password strength (min 8 characters)', async ({ page }) => {
    await page.goto('/register');

    await page.fill('[name="email"]', 'new@example.com');
    await page.fill('[name="password"]', 'short');
    await page.fill('[name="confirmPassword"]', 'short');

    await page.click('button[type="submit"]');

    // Should show weak password error
    await expect(page.locator('.error, [role="alert"]')).toBeVisible();
  });
});
```

**Estimated Effort:** 2 hours

---

#### 3. Create Snippet Workflow

**File:** `tests/e2e/snippets/create.spec.ts`

**User Story:** "As a logged-in user, I want to create a new snippet"

**Test Scenarios:**

```typescript
import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth-helpers';

test.describe('Create Snippet', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('creates snippet with valid data', async ({ page }) => {
    await page.goto('/snippet/new');

    // Fill snippet form
    await page.fill('[name="title"]', 'Test Snippet');
    await page.selectOption('[name="language"]', 'javascript');
    await page.fill('[name="code"]', 'console.log("Hello, World!");');
    await page.fill('[name="description"]', 'A simple test snippet');
    await page.fill('[name="tags"]', 'test, javascript, hello');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to snippet detail page
    await expect(page).toHaveURL(/\/snippet\/[a-f0-9-]+$/);

    // Verify snippet is displayed
    await expect(page.locator('h1')).toContainText('Test Snippet');
    await expect(page.locator('code, pre')).toContainText('console.log');
  });

  test('shows validation errors for empty required fields', async ({ page }) => {
    await page.goto('/snippet/new');

    // Try to submit without filling
    await page.click('button[type="submit"]');

    // Should show validation errors
    await expect(page.locator('.error, [role="alert"]')).toBeVisible();
  });

  test('validates title length (max 255 characters)', async ({ page }) => {
    await page.goto('/snippet/new');

    await page.fill('[name="title"]', 'a'.repeat(256));
    await page.selectOption('[name="language"]', 'javascript');
    await page.fill('[name="code"]', 'test');

    await page.click('button[type="submit"]');

    // Should show error
    await expect(page.locator('.error, [role="alert"]')).toContainText(/255/);
  });

  test('displays all supported languages in dropdown', async ({ page }) => {
    await page.goto('/snippet/new');

    const languages = [
      'javascript', 'typescript', 'python', 'java',
      'csharp', 'cpp', 'go', 'rust', 'php', 'ruby',
      'sql', 'html', 'css'
    ];

    for (const lang of languages) {
      const option = page.locator(`option[value="${lang}"]`);
      await expect(option).toBeVisible();
    }
  });

  test('redirects unauthenticated users to login', async ({ page }) => {
    // Don't login, just navigate
    await page.goto('/snippet/new');

    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });
});
```

**Estimated Effort:** 3-4 hours

---

#### 4. AI Feature Integration

**File:** `tests/e2e/snippets/create-with-ai.spec.ts`

**User Story:** "As a user, I want to use AI to generate descriptions and tags"

**Test Scenarios:**

```typescript
test.describe('AI Features in Snippet Creation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/snippet/new');
  });

  test('generates description using AI', async ({ page }) => {
    // Fill code first
    await page.fill('[name="code"]', 'function add(a, b) { return a + b; }');
    await page.selectOption('[name="language"]', 'javascript');

    // Click generate description button
    await page.click('button:has-text("Generate with AI"), button:has-text("✨")');

    // Wait for AI response
    await page.waitForSelector('[name="description"]', { state: 'attached' });

    // Description field should be populated
    const description = await page.inputValue('[name="description"]');
    expect(description.length).toBeGreaterThan(0);
  });

  test('suggests tags using AI', async ({ page }) => {
    // Fill code first
    await page.fill('[name="code"]', 'SELECT * FROM users WHERE id = 1;');
    await page.selectOption('[name="language"]', 'sql');

    // Click suggest tags button
    await page.click('button:has-text("Suggest with AI")');

    // Wait for AI response
    await page.waitForTimeout(2000); // Give AI time to respond

    // Tags field should be populated
    const tags = await page.inputValue('[name="tags"]');
    expect(tags.length).toBeGreaterThan(0);
  });

  test('shows loading state during AI generation', async ({ page }) => {
    await page.fill('[name="code"]', 'print("hello")');
    await page.selectOption('[name="language"]', 'python');

    // Click generate
    await page.click('button:has-text("Generate with AI")');

    // Should show loading state
    await expect(page.locator('button:has-text("Generating..."), button:has-text("✨ Generating")')).toBeVisible();
  });

  test('handles AI errors gracefully', async ({ page }) => {
    // Fill with empty code to trigger validation error
    await page.selectOption('[name="language"]', 'javascript');

    await page.click('button:has-text("Generate with AI")');

    // Should show error message
    await expect(page.locator('.error, [role="alert"]')).toBeVisible();
  });
});
```

**Estimated Effort:** 3-4 hours

---

#### 5. View and Search Snippets

**File:** `tests/e2e/snippets/list.spec.ts`

**User Story:** "As a user, I want to browse and search my snippets"

**Test Scenarios:**

```typescript
import { cleanupTestSnippets, createTestSnippet } from '../helpers/db-helpers';

test.describe('Snippet List and Search', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    // Create some test snippets via DB
    // ... setup code
  });

  test.afterEach(async () => {
    // Cleanup test data
    await cleanupTestSnippets(TEST_USER_ID);
  });

  test('displays all user snippets', async ({ page }) => {
    await page.goto('/dashboard');

    // Should see snippet cards
    const snippetCards = page.locator('.snippet-card, [data-testid="snippet-card"]');
    await expect(snippetCards).toHaveCount(3); // Assuming 3 test snippets created
  });

  test('filters snippets by language', async ({ page }) => {
    await page.goto('/dashboard');

    // Select JavaScript from language filter
    await page.selectOption('[name="language-filter"], select[id*="language"]', 'javascript');

    // Should only show JavaScript snippets
    const snippetCards = page.locator('.snippet-card, [data-testid="snippet-card"]');
    await expect(snippetCards).toHaveCountGreaterThan(0);

    // All visible cards should show JavaScript language badge
    const badges = page.locator('.language-badge, [data-language="javascript"]');
    await expect(badges).toHaveCountGreaterThan(0);
  });

  test('searches snippets by title', async ({ page }) => {
    await page.goto('/dashboard');

    // Type in search box
    await page.fill('input[type="search"], input[placeholder*="Search"]', 'Array Sort');

    // Wait for search results
    await page.waitForTimeout(600); // Debounce delay

    // Should show matching snippets
    await expect(page.locator('.snippet-card:has-text("Array Sort")')).toBeVisible();
  });

  test('shows empty state when no snippets found', async ({ page }) => {
    // Clean up all snippets first
    await cleanupTestSnippets(TEST_USER_ID);

    await page.goto('/dashboard');

    // Should show empty state
    await expect(page.locator('text=/no snippets/i, text=/get started/i')).toBeVisible();
    await expect(page.locator('a[href="/snippet/new"]')).toBeVisible();
  });

  test('navigates to snippet detail on card click', async ({ page }) => {
    await page.goto('/dashboard');

    // Click first snippet card
    await page.click('.snippet-card:first-child, [data-testid="snippet-card"]:first-child');

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/snippet\/[a-f0-9-]+$/);
  });
});
```

**Estimated Effort:** 3-4 hours

---

#### 6. Edit Snippet Workflow

**File:** `tests/e2e/snippets/edit.spec.ts`

**User Story:** "As a user, I want to edit my existing snippets"

**Test Scenarios:**

```typescript
test.describe('Edit Snippet', () => {
  let testSnippetId: string;

  test.beforeEach(async ({ page }) => {
    await login(page);

    // Create a test snippet to edit
    const snippet = await createTestSnippet(TEST_USER_ID, {
      title: 'Original Title',
      code: 'console.log("original");',
      language: 'javascript',
    });
    testSnippetId = snippet.id;
  });

  test('updates snippet title', async ({ page }) => {
    await page.goto(`/snippet/${testSnippetId}/edit`);

    // Update title
    await page.fill('[name="title"]', 'Updated Title');
    await page.click('button[type="submit"]');

    // Should redirect to detail page
    await expect(page).toHaveURL(`/snippet/${testSnippetId}`);

    // Should show updated title
    await expect(page.locator('h1')).toContainText('Updated Title');
  });

  test('updates snippet code', async ({ page }) => {
    await page.goto(`/snippet/${testSnippetId}/edit`);

    await page.fill('[name="code"]', 'console.log("updated");');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(`/snippet/${testSnippetId}`);
    await expect(page.locator('code, pre')).toContainText('updated');
  });

  test('cancels edit and returns to detail page', async ({ page }) => {
    await page.goto(`/snippet/${testSnippetId}/edit`);

    // Click cancel
    await page.click('a:has-text("Cancel"), button:has-text("Cancel")');

    // Should return to detail page
    await expect(page).toHaveURL(`/snippet/${testSnippetId}`);
  });

  test('prevents editing snippets from other users', async ({ page }) => {
    // TODO: Create snippet for different user
    // Try to access edit page
    // Should show 404 or redirect
  });
});
```

**Estimated Effort:** 2-3 hours

---

### 🟡 Priority 1: Additional Workflows

#### 7. Delete Snippet

**File:** `tests/e2e/snippets/delete.spec.ts`

**Test Scenarios:**

```typescript
test('deletes snippet with confirmation', async ({ page }) => {
  await login(page);
  const snippet = await createTestSnippet(TEST_USER_ID, { title: 'To Delete' });

  await page.goto(`/snippet/${snippet.id}`);

  // Click delete button
  await page.click('button:has-text("Delete")');

  // Confirm deletion in dialog
  page.on('dialog', dialog => dialog.accept());
  await page.click('button:has-text("Delete")'); // Might trigger dialog

  // Should redirect to dashboard
  await expect(page).toHaveURL('/dashboard');

  // Snippet should no longer appear
  await expect(page.locator(`text="${snippet.title}"`)).not.toBeVisible();
});
```

**Estimated Effort:** 1-2 hours

---

#### 8. Logout Flow

**File:** `tests/e2e/auth/logout.spec.ts`

**Test Scenarios:**

```typescript
test('logs out successfully', async ({ page }) => {
  await login(page);

  // Click logout button
  await page.click('button:has-text("Logout"), a:has-text("Logout")');

  // Should redirect to home or login
  await expect(page).toHaveURL(/\/(|login)/);

  // Try to access protected page
  await page.goto('/dashboard');

  // Should redirect to login
  await expect(page).toHaveURL('/login');
});
```

**Estimated Effort:** 1 hour

---

### 🟢 Priority 2: Edge Cases & Polish

#### 9. Responsive Design Tests

**File:** `tests/e2e/responsive/mobile.spec.ts`

```typescript
test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('mobile navigation works', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');

    // Check for mobile menu
    await expect(page.locator('button[aria-label*="menu"], .hamburger')).toBeVisible();
  });
});
```

**Estimated Effort:** 2 hours

---

## Test Execution Strategy

### Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test tests/e2e/auth/login.spec.ts

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in debug mode
npx playwright test --debug

# Run with specific browser
npx playwright test --project=chromium

# Generate test report
npx playwright show-report
```

### CI/CD Integration

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

---

## Best Practices

### Do's ✅
- **Use data-testid attributes** for reliable selectors
- **Test user workflows**, not implementation details
- **Clean up test data** after each test
- **Use Page Object Model** for complex pages
- **Mock external APIs** (OpenAI) when possible
- **Take screenshots on failure** (Playwright does this automatically)
- **Test critical paths only** - Keep E2E tests focused

### Don'ts ❌
- **Don't test every edge case** - Use unit tests for that
- **Don't rely on test execution order** - Tests should be independent
- **Don't use hardcoded waits** - Use Playwright's auto-waiting
- **Don't test authentication in every file** - Use helpers
- **Don't leave test data in database** - Always clean up
- **Don't duplicate unit test coverage** - Focus on integration

---

## Implementation Priority Summary

**Total Estimated Effort:** 20-25 hours

| Priority | Tests | Effort | Description |
|----------|-------|--------|-------------|
| 🔴 P0 | 6 files | 16-19h | Auth + Create + List + Edit + AI |
| 🟡 P1 | 2 files | 2-3h | Delete + Logout |
| 🟢 P2 | 1 file | 2h | Mobile/Responsive |
| **Total** | **9 files** | **20-25h** | **Complete E2E coverage** |

---

## Next Steps for Implementation

1. ✅ Read this document completely
2. Create test directory structure (`tests/e2e/`)
3. Set up authentication helpers
4. Create test user in Supabase
5. Start with Priority 0, File #1 (Login tests)
6. Run tests frequently to ensure they pass
7. Proceed sequentially through priorities
8. Document any deviations or issues

---

**Document End**
