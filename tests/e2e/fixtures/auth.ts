/**
 * Test user credentials and authentication fixtures
 *
 * These users should be created in the test Supabase project:
 * 1. Go to Supabase Dashboard → Authentication → Users
 * 2. Add user with these credentials
 * 3. Enable "Auto-confirm user"
 * 4. Copy UUID to .env.test file
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load test environment variables
config({ path: resolve(process.cwd(), '.env.test') });

/**
 * Primary test user for E2E tests
 * Create in Supabase: Authentication → Users → Add user
 * Email: e2e-test@aimanager.com
 * Password: Password123
 * Auto-confirm: YES
 */
export const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'e2e-test@aimanager.com',
  password: process.env.TEST_USER_PASSWORD || 'Password123',
  id: process.env.TEST_USER_ID || '',
};

/**
 * Secondary test user for multi-user scenarios
 * Used to test user isolation, permissions, etc.
 */
export const TEST_USER_2 = {
  email: process.env.TEST_USER_2_EMAIL || 'e2e-test2@aimanager.com',
  password: process.env.TEST_USER_2_PASSWORD || 'Password123',
  id: process.env.TEST_USER_2_ID || '',
};

/**
 * Test Supabase configuration
 * Uses the same variable names as the main app (PUBLIC_SUPABASE_*)
 */
export const TEST_SUPABASE_CONFIG = {
  url: process.env.PUBLIC_SUPABASE_URL || '',
  anonKey: process.env.PUBLIC_SUPABASE_ANON_KEY || '',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
};

/**
 * Base URL for the application
 */
export const TEST_BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:4321';

/**
 * Validate that all required environment variables are set
 */
export function validateTestEnv(): void {
  const required = [
    'PUBLIC_SUPABASE_URL',
    'PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'TEST_USER_EMAIL',
    'TEST_USER_PASSWORD',
    'TEST_USER_ID',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables in .env.test: ${missing.join(', ')}\n` +
      'Run: npm run test:e2e:setup'
    );
  }
}
