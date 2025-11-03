/**
 * Authentication helper functions for E2E tests
 *
 * These helpers provide reusable authentication functionality
 * to avoid duplicating login/logout logic across test files.
 */

import { Page, expect } from '@playwright/test';
import { TEST_USER, TEST_USER_2 } from '../fixtures/auth';

/**
 * Login with the primary test user
 * Navigates to login page, fills form, submits, and waits for dashboard
 *
 * @param page - Playwright page object
 */
export async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  // Fill login form
  await page.fill('input#email', TEST_USER.email);
  await page.fill('input#password', TEST_USER.password);

  // Submit form and wait for navigation
  await Promise.all([
    page.waitForURL('/dashboard', { timeout: 30000 }),
    page.click('button[type="submit"]'),
  ]);

  // Verify user is actually logged in
  await expect(page).toHaveURL('/dashboard');

  // Wait for page to be fully loaded
  await page.waitForLoadState('networkidle');
}

/**
 * Login with the secondary test user (for multi-user scenarios)
 *
 * @param page - Playwright page object
 */
export async function loginAsUser2(page: Page): Promise<void> {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  await page.fill('input#email', TEST_USER_2.email);
  await page.fill('input#password', TEST_USER_2.password);

  await Promise.all([
    page.waitForURL('/dashboard', { timeout: 30000 }),
    page.click('button[type="submit"]'),
  ]);

  await expect(page).toHaveURL('/dashboard');
  await page.waitForLoadState('networkidle');
}

/**
 * Login with custom credentials
 * Useful for testing login with invalid credentials
 *
 * @param page - Playwright page object
 * @param email - Email address
 * @param password - Password
 */
export async function loginWith(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  await page.fill('input#email', email);
  await page.fill('input#password', password);

  await page.click('button[type="submit"]');
}

/**
 * Logout from the application
 * Note: Implementation depends on how logout is handled in your app
 * This assumes a logout button exists in the UI
 *
 * @param page - Playwright page object
 */
export async function logout(page: Page): Promise<void> {
  // Look for logout button/link (adjust selector based on actual UI)
  const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout"), button:has-text("Sign out"), a:has-text("Sign out")');

  // If logout button exists, click it
  if (await logoutButton.isVisible()) {
    await logoutButton.click();
  } else {
    // Alternative: Clear cookies/localStorage to force logout
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.context().clearCookies();
  }

  // Wait for redirect to home or login page
  await page.waitForURL(/\/(|login)/, { timeout: 5000 });
}

/**
 * Check if user is currently logged in
 * Attempts to visit dashboard and checks if redirected to login
 *
 * @param page - Playwright page object
 * @returns true if logged in, false otherwise
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  await page.goto('/dashboard');
  const url = page.url();
  return url.includes('/dashboard');
}

/**
 * Login using stored session (faster than full login flow)
 * Useful for tests that need authentication but don't test login itself
 *
 * Note: This requires implementing session storage/retrieval
 * For now, falls back to regular login
 *
 * @param page - Playwright page object
 */
export async function loginWithStoredSession(page: Page): Promise<void> {
  // TODO: Implement session storage for faster test execution
  // For now, just use regular login
  await login(page);
}

/**
 * Assert that user is redirected to login page (not authenticated)
 *
 * @param page - Playwright page object
 */
export async function expectNotAuthenticated(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/login/);
}

/**
 * Assert that user is on dashboard (authenticated)
 *
 * @param page - Playwright page object
 */
export async function expectAuthenticated(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/dashboard/);
}
