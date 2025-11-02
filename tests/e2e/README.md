# E2E Test Setup Guide

This guide will help you set up the test database and environment for running end-to-end tests with Playwright.

## Prerequisites

- Node.js and npm installed
- Supabase account (free tier is fine)
- Access to create a new Supabase project

---

## Quick Start Checklist

Follow these steps in order:

### ✅ Step 1: Create Test Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. **Project Name:** `ai-snippet-manager-test`
4. **Database Password:** Choose a simple password (this is test-only)
5. **Region:** Choose closest to you
6. Click **"Create new project"**
7. ⏳ Wait 2-3 minutes for project to be ready

### ✅ Step 2: Set Up Database Schema

You need to copy the database schema from your development/production project.

**Option A: Export/Import via SQL**

1. **Export from dev project:**
   - Go to your dev Supabase project
   - Navigate to **SQL Editor**
   - Click **"New query"** → Paste this:
   ```sql
   -- Export schema
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public';
   ```
   - Find your `snippets` table schema
   - Copy the CREATE TABLE statements

2. **Import to test project:**
   - Go to your test Supabase project
   - Navigate to **SQL Editor**
   - Paste and run the CREATE TABLE statements

**Option B: Use Migration Files** (if you have them)

```bash
# Apply migrations to test database
# (Requires Supabase CLI)
supabase db push --db-url "postgresql://..."
```

**Required Tables:**
- `snippets` table with all columns
- RLS policies for user isolation
- Triggers for `updated_at` timestamps

### ✅ Step 3: Create Test Users

1. Go to your **test** Supabase project
2. Navigate to **Authentication** → **Users**
3. Click **"Add user"**
4. Fill in:
   - **Email:** `e2e-test@example.com`
   - **Password:** `TestPassword123!`
   - **Auto-confirm user:** ✅ **YES** (important!)
5. Click **"Create user"**
6. 📋 **Copy the user UUID** (you'll need this)

**Optional: Create second test user**
- Repeat steps above with:
  - Email: `e2e-test-2@example.com`
  - Password: `TestPassword456!`

### ✅ Step 4: Get API Keys

1. In your test Supabase project
2. Navigate to **Settings** → **API**
3. Copy these three values:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **anon public** key (long JWT starting with `eyJhbGc...`)
   - **service_role** key (long JWT, shown as SECRET, click "Reveal")

### ✅ Step 5: Configure .env.test

1. **Copy the example file:**
   ```bash
   cp .env.test.example .env.test
   ```

2. **Fill in the values:**
   ```env
   # From Step 4 - API Keys
   TEST_SUPABASE_URL=https://your-project-id.supabase.co
   TEST_SUPABASE_ANON_KEY=eyJhbGc... (your anon key)
   TEST_SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (your service role key)

   # From Step 3 - Test Users
   TEST_USER_EMAIL=e2e-test@example.com
   TEST_USER_PASSWORD=TestPassword123!
   TEST_USER_ID=uuid-copied-from-step-3

   # Optional: Second user
   TEST_USER_2_EMAIL=e2e-test-2@example.com
   TEST_USER_2_PASSWORD=TestPassword456!
   TEST_USER_2_ID=uuid-copied-from-step-3
   ```

3. **Save the file**

### ✅ Step 6: Validate Configuration

Run the validation script:

```bash
npm run test:e2e:validate
```

**Expected output:**
```
🔍 Validating .env.test configuration...

✅ TEST_SUPABASE_URL is configured
✅ TEST_SUPABASE_ANON_KEY is configured
✅ TEST_SUPABASE_SERVICE_ROLE_KEY is configured
✅ TEST_USER_EMAIL is configured
✅ TEST_USER_PASSWORD is configured
✅ TEST_USER_ID is configured

✅ All required environment variables are configured!
```

If you see errors, fix them in `.env.test` and run again.

### ✅ Step 7: Test Database Connection

Run the connection test:

```bash
npm run test:e2e:check
```

**Expected output:**
```
🔄 Testing connection to test Supabase database...

1️⃣  Testing database connection...
   ✅ Database connection successful

2️⃣  Checking if test user exists...
   ✅ Test user found: e2e-test@example.com
   User ID: uuid-here

3️⃣  Testing authentication with test user credentials...
   ✅ Authentication successful
   Access token received

4️⃣  Testing snippet query for test user...
   ✅ Snippet query successful
   Found 0 existing snippets for test user

5️⃣  Testing database write operations...
   ✅ Create snippet successful
   ✅ Delete snippet successful

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ ALL TESTS PASSED!

Your test database is properly configured.
You can now run E2E tests with confidence!
```

---

## Running E2E Tests

Once setup is complete, you can run tests:

```bash
# Run all E2E tests
npm run test:e2e

# Run with interactive UI
npm run test:e2e:ui

# Run specific test file
npx playwright test tests/e2e/auth/login.spec.ts

# Debug mode
npx playwright test --debug

# Run full validation + connection test
npm run test:e2e:setup
```

---

## Troubleshooting

### "TEST_SUPABASE_URL is not set"

- Make sure you created `.env.test` (copy from `.env.test.example`)
- Check that the file is in the project root directory

### "Test user not found"

- Make sure you created the user in the **test** project (not dev)
- Verify you copied the correct UUID
- Check that **Auto-confirm user** was enabled

### "Authentication failed"

- Verify email and password are correct
- Make sure user was auto-confirmed
- Try logging in manually via Supabase dashboard

### "Database connection failed"

- Check `TEST_SUPABASE_URL` is correct (should end with `.supabase.co`)
- Verify `TEST_SUPABASE_SERVICE_ROLE_KEY` is the service role (not anon key)
- Make sure project is not paused (free tier pauses after inactivity)

### "Query failed"

- Verify database schema is set up correctly
- Check that `snippets` table exists
- Ensure RLS policies allow test user to query

### "RLS policy violation"

- Make sure RLS policies are configured for the `snippets` table
- Policies should allow users to access only their own snippets
- Use service role key for admin operations (bypasses RLS)

---

## Best Practices

✅ **Always clean up test data**
- Tests automatically clean up after each run
- If a test fails, data might remain - run cleanup manually

✅ **Never use production database**
- Test database is completely separate
- No risk to production data

✅ **Keep test users distinct**
- Use `e2e-test@example.com` prefix
- Easy to identify test data

✅ **Regular cleanup**
- Periodically check test database for orphaned data
- Can wipe and recreate test database anytime

---

## Need Help?

1. **Check validation:** `npm run test:e2e:validate`
2. **Check connection:** `npm run test:e2e:check`
3. **Review plan:** See `.ai/e2e-test-plan.md` for detailed setup
4. **Check logs:** Look at console output for specific errors

---

## Security Notes

⚠️ **Service Role Key**
- The `TEST_SUPABASE_SERVICE_ROLE_KEY` has full admin access
- **NEVER** commit `.env.test` to git (already in `.gitignore`)
- Only use in test environment, never in browser code

✅ **Safe to share in test environment:**
- Project URL
- Anon key
- Test user emails

❌ **NEVER share:**
- Service role key
- Test user passwords (though these are test-only)

---

## Summary

✅ Test database is isolated and safe
✅ Test users are dedicated for E2E tests
✅ Automatic cleanup prevents data buildup
✅ Validation scripts catch configuration errors
✅ Ready to run comprehensive E2E tests!

**Next step:** Run `npm run test:e2e` to execute all E2E tests!
