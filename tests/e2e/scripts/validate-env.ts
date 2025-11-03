/**
 * Validates that .env.test is properly configured before running E2E tests
 * Run with: npx tsx tests/e2e/scripts/validate-env.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Load .env.test file
const envPath = resolve(process.cwd(), '.env.test');

if (!existsSync(envPath)) {
  console.error('❌ ERROR: .env.test file not found!');
  console.error('');
  console.error('Please create .env.test from .env.test.example:');
  console.error('  cp .env.test.example .env.test');
  console.error('');
  console.error('Then fill in your test Supabase credentials.');
  process.exit(1);
}

// Load environment variables
config({ path: envPath });

// Required environment variables
const requiredVars = [
  'TEST_SUPABASE_URL',
  'TEST_SUPABASE_ANON_KEY',
  'TEST_SUPABASE_SERVICE_ROLE_KEY',
  'TEST_USER_EMAIL',
  'TEST_USER_PASSWORD',
  'TEST_USER_ID',
];

// Optional but recommended
const optionalVars = [
  'TEST_USER_2_EMAIL',
  'TEST_USER_2_PASSWORD',
  'TEST_USER_2_ID',
];

console.log('🔍 Validating .env.test configuration...\n');

// Check required variables
let hasErrors = false;
const errors: string[] = [];
const warnings: string[] = [];

for (const varName of requiredVars) {
  const value = process.env[varName];

  if (!value) {
    hasErrors = true;
    errors.push(`❌ ${varName} is not set`);
  } else if (value.includes('YOUR_') || value.includes('00000000-0000')) {
    hasErrors = true;
    errors.push(`❌ ${varName} contains placeholder value: ${value.substring(0, 50)}...`);
  } else {
    console.log(`✅ ${varName} is configured`);
  }
}

console.log('');

// Check optional variables
for (const varName of optionalVars) {
  const value = process.env[varName];

  if (!value) {
    warnings.push(`⚠️  ${varName} is not set (optional, for multi-user tests)`);
  } else if (value.includes('YOUR_') || value.includes('00000000-0000')) {
    warnings.push(`⚠️  ${varName} contains placeholder value`);
  } else {
    console.log(`✅ ${varName} is configured (optional)`);
  }
}

console.log('');

// Validate URL format
const url = process.env.TEST_SUPABASE_URL;
if (url && !url.startsWith('https://') && !url.startsWith('http://')) {
  errors.push(`❌ TEST_SUPABASE_URL should start with https://`);
}
if (url && !url.includes('.supabase.co') && !url.includes('localhost')) {
  warnings.push(`⚠️  TEST_SUPABASE_URL doesn't look like a Supabase URL: ${url}`);
}

// Validate email format
const email = process.env.TEST_USER_EMAIL;
if (email && !email.includes('@')) {
  errors.push(`❌ TEST_USER_EMAIL doesn't look like a valid email: ${email}`);
}

// Validate UUID format (basic check)
const userId = process.env.TEST_USER_ID;
if (userId && userId.length !== 36) {
  errors.push(`❌ TEST_USER_ID doesn't look like a valid UUID (should be 36 chars): ${userId}`);
}

// Print warnings
if (warnings.length > 0) {
  console.log('Warnings:');
  warnings.forEach(w => console.log(w));
  console.log('');
}

// Print errors and exit
if (hasErrors) {
  console.log('❌ VALIDATION FAILED\n');
  console.log('Errors:');
  errors.forEach(e => console.log(e));
  console.log('');
  console.log('Please fix the errors in .env.test and try again.');
  console.log('See .env.test.example for guidance.');
  process.exit(1);
}

// Success!
console.log('✅ All required environment variables are configured!');
console.log('');
console.log('You can now run E2E tests:');
console.log('  npm run test:e2e');
console.log('');

// Optional: Test connection to Supabase
console.log('💡 TIP: You can verify the connection by running:');
console.log('  npx tsx tests/e2e/scripts/test-connection.ts');
