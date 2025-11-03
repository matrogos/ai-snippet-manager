/**
 * E2E Test Runner Script
 *
 * This script temporarily moves .env.local during test execution to prevent
 * production credentials from overriding test credentials.
 *
 * Astro loads .env.local with the highest priority, so we need to move it
 * temporarily to ensure .env.test credentials are used.
 */

import { existsSync, renameSync } from 'fs';
import { spawn } from 'child_process';

const envLocalPath = '.env.local';
const envLocalBackup = '.env.local.backup';
let movedEnvLocal = false;

// Cleanup function to restore .env.local
function cleanup() {
  if (movedEnvLocal && existsSync(envLocalBackup)) {
    console.log('\n✓ Restoring .env.local...');
    renameSync(envLocalBackup, envLocalPath);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  cleanup();
  process.exit(130);
});

process.on('SIGTERM', () => {
  cleanup();
  process.exit(143);
});

try {
  // Move .env.local if it exists
  if (existsSync(envLocalPath)) {
    console.log('→ Temporarily moving .env.local to .env.local.backup...');
    renameSync(envLocalPath, envLocalBackup);
    movedEnvLocal = true;
  }

  console.log('→ Running Playwright tests with .env.test credentials...\n');

  // Run Playwright tests with any additional arguments passed to this script
  const args = ['playwright', 'test', ...process.argv.slice(2)];
  const playwright = spawn('npx', args, {
    stdio: 'inherit',
    shell: true
  });

  playwright.on('close', (code) => {
    cleanup();
    process.exit(code);
  });

  playwright.on('error', (error) => {
    console.error('Failed to start Playwright:', error);
    cleanup();
    process.exit(1);
  });

} catch (error) {
  console.error('Error:', error);
  cleanup();
  process.exit(1);
}
