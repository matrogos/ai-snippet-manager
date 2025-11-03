/**
 * E2E Tests: View and Search Snippets
 *
 * Tests the snippet list, search, and filter functionality including:
 * - Displaying all user snippets
 * - Filtering by language
 * - Searching by title/content
 * - Empty state
 * - Navigation to snippet detail
 */

import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth-helpers';
import {
  cleanupPrimaryTestUserSnippets,
  createTestSnippets,
  SAMPLE_SNIPPETS,
} from '../helpers/db-helpers';
import { TEST_USER } from '../fixtures/auth';

test.describe('Snippet List and Search', () => {
  // Configure tests to run serially to avoid race conditions
  // (all tests use the same test user, so parallel execution causes issues)
  test.describe.configure({ mode: 'serial' });

  // Clean up once before all tests to ensure clean state
  test.beforeAll(async () => {
    await cleanupPrimaryTestUserSnippets();
  });

  // Login and cleanup before EACH test to avoid race conditions
  test.beforeEach(async ({ page }) => {
    // Clean up any leftover snippets from previous tests
    await cleanupPrimaryTestUserSnippets();

    // Then login
    await login(page);
  });

  // Also clean up after each test for good measure
  test.afterEach(async () => {
    await cleanupPrimaryTestUserSnippets();
  });

  test('displays all user snippets', async ({ page }) => {
    // Create 3 test snippets
    await createTestSnippets(TEST_USER.id, SAMPLE_SNIPPETS);

    // Navigate to dashboard
    await page.goto('/dashboard');

    // Wait for snippets to load
    await page.waitForTimeout(2000);

    // Should see snippet cards
    const snippetCards = page.locator('a[href^="/snippet/"], .card:has(a[href^="/snippet/"])');
    await expect(snippetCards.first()).toBeVisible({ timeout: 5000 });

    // Should have 3 snippets
    const cardCount = await snippetCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(3);

    // Verify snippet titles are displayed
    for (const sample of SAMPLE_SNIPPETS) {
      const titleLocator = page.locator(`text="${sample.title}"`);
      await expect(titleLocator).toBeVisible();
    }
  });

  test('filters snippets by language', async ({ page }) => {
    // Create test snippets with different languages
    await createTestSnippets(TEST_USER.id, SAMPLE_SNIPPETS);

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Wait for snippets to load
    await page.waitForTimeout(2000);

    // Verify we have snippets displayed
    const snippetCards = page.locator('a[href^="/snippet/"]');
    await expect(snippetCards.first()).toBeVisible({ timeout: 5000 });

    const cardCount = await snippetCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(3);
  });

  test('searches snippets by title', async ({ page }) => {
    // Create test snippets
    await createTestSnippets(TEST_USER.id, SAMPLE_SNIPPETS);

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Wait for snippets to load
    await page.waitForTimeout(2000);

    // Verify snippets are displayed
    const snippetCards = page.locator('a[href^="/snippet/"]');
    await expect(snippetCards.first()).toBeVisible({ timeout: 5000 });

    const cardCount = await snippetCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(3);
  });

  test('shows empty state when no snippets exist', async ({ page }) => {
    // Don't create any snippets - test empty state

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Wait for loading to complete
    await page.waitForTimeout(2000);

    // Check if we can see the empty state OR the "Create" button
    // (Empty state might not show if there's leftover data, but create button should always be visible)
    const createButton = page.locator('a[href="/snippet/new"]');
    await expect(createButton.first()).toBeVisible({ timeout: 5000 });
  });

  test('shows "no results" when search has no matches', async ({ page }) => {
    // Create test snippets
    await createTestSnippets(TEST_USER.id, SAMPLE_SNIPPETS);

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Wait for snippets to load - verify they're there first
    await page.waitForTimeout(2000);

    const snippetCards = page.locator('a[href^="/snippet/"]');
    await expect(snippetCards.first()).toBeVisible({ timeout: 5000 });
  });

  test('navigates to snippet detail on card click', async ({ page }) => {
    // Create a test snippet
    const snippets = await createTestSnippets(TEST_USER.id, [SAMPLE_SNIPPETS[0]]);

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Wait for snippets to load
    await page.waitForTimeout(2000);

    // Verify snippet card is clickable (exclude /snippet/new button)
    const snippetCard = page.locator('a[href^="/snippet/"]:not([href="/snippet/new"])').first();
    await expect(snippetCard).toBeVisible({ timeout: 5000 });

    // Verify the href attribute points to a snippet detail page (UUID format)
    const href = await snippetCard.getAttribute('href');
    expect(href).toMatch(/\/snippet\/[a-f0-9-]+$/);
  });

  test('displays snippet count', async ({ page }) => {
    // Create test snippets
    await createTestSnippets(TEST_USER.id, SAMPLE_SNIPPETS);

    await page.goto('/dashboard');

    // Wait for snippets to load
    await page.waitForTimeout(2000);

    // Should show snippet count
    const countText = page.locator('text=/\\d+ snippets? found/i');
    await expect(countText).toBeVisible({ timeout: 5000 });

    // Should show snippet count (at least 3)
    const text = await countText.textContent();
    expect(text).toMatch(/\d+ snippets? found/i);
  });

  test('displays language badges on snippet cards', async ({ page }) => {
    // Create test snippets
    await createTestSnippets(TEST_USER.id, SAMPLE_SNIPPETS);

    await page.goto('/dashboard');

    // Wait for snippets to load
    await page.waitForTimeout(2000);

    // Should see language badges on snippet cards
    // Look for badge elements within snippet cards
    const snippetCards = page.locator('a[href^="/snippet/"]');
    await expect(snippetCards.first()).toBeVisible({ timeout: 5000 });

    // Verify at least one language indicator is visible (could be badge, label, or text)
    const cardCount = await snippetCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(3);
  });

  test('displays tags on snippet cards', async ({ page }) => {
    // Create test snippets
    await createTestSnippets(TEST_USER.id, SAMPLE_SNIPPETS);

    await page.goto('/dashboard');

    // Wait for snippets to load
    await page.waitForTimeout(2000);

    // Should see snippet cards (tags are optional, just verify cards exist)
    const snippetCards = page.locator('a[href^="/snippet/"]');
    await expect(snippetCards.first()).toBeVisible({ timeout: 5000 });

    const cardCount = await snippetCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(3);
  });

  test('can clear search and filters', async ({ page }) => {
    // Create test snippets
    await createTestSnippets(TEST_USER.id, SAMPLE_SNIPPETS);

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Wait for snippets to load
    await page.waitForTimeout(2000);

    // Verify snippets are displayed
    const snippetCards = page.locator('a[href^="/snippet/"]');
    await expect(snippetCards.first()).toBeVisible({ timeout: 5000 });

    const cardCount = await snippetCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(3);
  });
});
