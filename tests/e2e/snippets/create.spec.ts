/**
 * E2E Tests: Create Snippet
 *
 * Tests the snippet creation workflow including:
 * - Creating snippet with valid data
 * - Form validation for required fields
 * - Title length validation
 * - Language selection
 * - Authentication requirement
 */

import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth-helpers';
import { cleanupPrimaryTestUserSnippets, countUserSnippets } from '../helpers/db-helpers';
import { TEST_USER } from '../fixtures/auth';

test.describe('Create Snippet', () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // Clean up test data after each test
  test.afterEach(async () => {
    await cleanupPrimaryTestUserSnippets();
  });

  test('creates snippet with valid data', async ({ page }) => {
    // Navigate to new snippet page
    await page.goto('/snippet/new');
    await page.waitForLoadState('networkidle');

    // Verify we're on the correct page
    await expect(page).toHaveURL('/snippet/new');

    // Fill snippet form
    await page.fill('input#title', 'Test Snippet');
    await page.selectOption('select#language', 'javascript');
    await page.fill('textarea#code', 'console.log("Hello, World!");');
    await page.fill('textarea#description', 'A simple test snippet');
    await page.fill('input#tags', 'test, javascript, hello');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard after successful creation
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Verify we're on dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('shows validation errors for empty required fields', async ({ page }) => {
    await page.goto('/snippet/new');

    // Try to submit without filling required fields
    await page.click('button[type="submit"]');

    // Wait for validation
    await page.waitForTimeout(1000);

    // Should stay on the same page
    await expect(page).toHaveURL('/snippet/new');

    // Required fields should have required attribute
    const titleInput = page.locator('input#title');
    const languageSelect = page.locator('select#language');
    const codeTextarea = page.locator('textarea#code');

    await expect(titleInput).toHaveAttribute('required');
    await expect(languageSelect).toHaveAttribute('required');
    await expect(codeTextarea).toHaveAttribute('required');
  });

  test('validates title length (max 255 characters)', async ({ page }) => {
    await page.goto('/snippet/new');
    await page.waitForLoadState('networkidle');

    // The form uses maxLength attribute which should prevent typing more than 255 chars
    const titleInput = page.locator('input#title');
    await expect(titleInput).toHaveAttribute('maxLength', '255');

    // Try to fill with a title that's too long
    const longTitle = 'a'.repeat(300);
    await page.fill('input#title', longTitle);

    // The input value should be truncated to 255
    const titleValue = await titleInput.inputValue();
    expect(titleValue.length).toBeLessThanOrEqual(255);
  });

  test('displays all supported languages in dropdown', async ({ page }) => {
    await page.goto('/snippet/new');

    // Get the language dropdown
    const languageSelect = page.locator('select#language');

    // Check that common languages are available
    const expectedLanguages = [
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
    ];

    for (const lang of expectedLanguages) {
      const option = languageSelect.locator(`option[value="${lang}"]`);
      await expect(option).toBeAttached();
    }

    // Verify default selection (usually javascript)
    const selectedValue = await languageSelect.inputValue();
    expect(selectedValue).toBeTruthy();
  });

  test('redirects unauthenticated users to login', async ({ page }) => {
    // Navigate first, then clear session to simulate logged-out state
    await page.goto('/');

    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Try to access new snippet page
    await page.goto('/snippet/new');

    // Should redirect to login
    await page.waitForURL(/\/login/, { timeout: 5000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('can cancel and return to dashboard', async ({ page }) => {
    await page.goto('/snippet/new');
    await page.waitForLoadState('networkidle');

    // Fill some data
    await page.fill('input#title', 'Test Snippet');

    // Click cancel button - use more specific selector
    const cancelButton = page.locator('a.btn-secondary:has-text("Cancel")');
    await cancelButton.click();

    // Should return to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('shows character count for code field', async ({ page }) => {
    await page.goto('/snippet/new');

    // Type some code
    const testCode = 'console.log("test");';
    await page.fill('textarea#code', testCode);

    // Should show character count
    const characterCount = page.locator('text=/\\d+ \\/ 50,000 characters/i');
    await expect(characterCount).toBeVisible();

    // Verify count is approximately correct
    const countText = await characterCount.textContent();
    expect(countText).toMatch(/\d+/);
  });

  test('creates snippet with minimal required fields only', async ({ page }) => {
    await page.goto('/snippet/new');
    await page.waitForLoadState('networkidle');

    // Fill only required fields
    await page.fill('input#title', 'Minimal Snippet');
    await page.selectOption('select#language', 'python');
    await page.fill('textarea#code', 'print("minimal")');

    // Leave description and tags empty

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard after successful creation
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Verify we're on dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('displays loading state during submission', async ({ page }) => {
    await page.goto('/snippet/new');

    // Fill form
    await page.fill('input#title', 'Loading Test');
    await page.fill('textarea#code', 'test');
    await page.selectOption('select#language', 'javascript');

    // Click submit
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Button should show loading state
    // Based on SnippetForm.tsx, the button text changes to "Saving..."
    await expect(submitButton).toContainText(/saving/i);
  });
});
