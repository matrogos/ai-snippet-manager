/**
 * E2E Tests: User Login
 *
 * Tests the authentication flow for user login including:
 * - Successful login with valid credentials
 * - Error handling for invalid credentials
 * - Form validation (email format, empty fields)
 * - Redirect behavior for already logged-in users
 */

import { test, expect } from '@playwright/test';
import { login, logout } from '../helpers/auth-helpers';
import { TEST_USER } from '../fixtures/auth';

test.describe('User Login', () => {
  // Clean up: logout before each test to ensure clean state
  test.beforeEach(async ({ page }) => {
    // Navigate to a page first to avoid localStorage security errors
    await page.goto('/');

    // Clear any existing session
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('successful login with valid credentials', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Verify we're on the login page
    await expect(page).toHaveURL('/login');
    await expect(page.locator('h2').first()).toContainText(/login/i);

    // Fill login form (wait for React to hydrate)
    await page.fill('input#email', TEST_USER.email);
    await page.fill('input#password', TEST_USER.password);

    // Submit form and wait for navigation
    await Promise.all([
      page.waitForURL('/dashboard', { timeout: 30000 }),
      page.click('button[type="submit"]'),
    ]);

    // Verify redirect to dashboard
    await expect(page).toHaveURL('/dashboard');

    // Verify dashboard content is loaded
    await page.waitForLoadState('networkidle');
  });

  test('shows error message for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Try to login with invalid credentials
    await page.fill('input#email', 'invalid@example.com');
    await page.fill('input#password', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    // Wait a moment for the error to appear
    await page.waitForTimeout(2000);

    // Should stay on login page
    await expect(page).toHaveURL('/login');

    // Should show error message
    // The error is displayed in a div with red styling (bg-red-50)
    const errorMessage = page.locator('.bg-red-50, [role="alert"], .text-red-700');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    // Error should contain relevant text
    const errorText = await errorMessage.textContent();
    expect(errorText?.toLowerCase()).toMatch(/invalid|incorrect|wrong|failed/);
  });

  test('validates email format', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Try to fill with invalid email format
    await page.fill('input#email', 'not-an-email');
    await page.fill('input#password', 'password123');

    // The email input should have type="email" for HTML5 validation
    const emailInput = page.locator('input#email');
    await expect(emailInput).toHaveAttribute('type', 'email');

    // Try to submit
    await page.click('button[type="submit"]');

    // Wait a moment
    await page.waitForTimeout(1000);

    // Should show validation error (either HTML5 or custom)
    // Check for custom error message
    const errorMessage = page.locator('.bg-red-50, [role="alert"], .text-red-700');

    // Either HTML5 validation prevents submit or custom error shows
    const isOnLoginPage = page.url().includes('/login');
    expect(isOnLoginPage).toBe(true);
  });

  test('shows error when fields are empty', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Try to submit without filling any fields
    await page.click('button[type="submit"]');

    // Wait a moment for validation
    await page.waitForTimeout(1000);

    // Should stay on login page
    await expect(page).toHaveURL('/login');

    // The form uses HTML5 'required' attributes, so browser validation
    // should prevent submission. Alternatively, check for error messages.
    const emailInput = page.locator('input#email');
    const passwordInput = page.locator('input#password');

    // Inputs should have 'required' attribute
    await expect(emailInput).toHaveAttribute('required');
    await expect(passwordInput).toHaveAttribute('required');
  });

  test('redirects logged-in users away from login page', async ({ page }) => {
    // First, login successfully
    await login(page);

    // Verify we're on dashboard
    await expect(page).toHaveURL('/dashboard');

    // Now try to access login page directly
    // The server should redirect us back to dashboard
    await page.goto('/login', { waitUntil: 'networkidle' });

    // Should be redirected back to dashboard automatically
    await expect(page).toHaveURL('/dashboard');
  });

  test('displays loading state during login', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input#email', TEST_USER.email);
    await page.fill('input#password', TEST_USER.password);

    // Click submit and immediately check for loading state
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Button should show loading text or be disabled
    // Based on LoginForm.tsx, the button text changes to "Logging in..."
    await expect(submitButton).toContainText(/logging in/i);
  });

  test('can navigate to register page from login', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Find and click the "Sign up" link
    const signUpLink = page.locator('a[href="/register"], a:has-text("Sign up")');
    await expect(signUpLink).toBeVisible();
    await signUpLink.click();

    // Should navigate to register page
    await expect(page).toHaveURL('/register');
  });
});
