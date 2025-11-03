/**
 * Tests connection to test Supabase database
 * Run with: npx tsx tests/e2e/scripts/test-connection.ts
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.test
config({ path: resolve(process.cwd(), '.env.test') });

const supabaseUrl = process.env.TEST_SUPABASE_URL!;
const supabaseServiceKey = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY!;
const testUserEmail = process.env.TEST_USER_EMAIL!;
const testUserPassword = process.env.TEST_USER_PASSWORD!;
const testUserId = process.env.TEST_USER_ID!;

console.log('🔄 Testing connection to test Supabase database...\n');

// Create Supabase client with service role (admin)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  try {
    // Test 1: Check if we can connect to database
    console.log('1️⃣  Testing database connection...');
    const { data: tables, error: tablesError } = await supabase
      .from('snippets')
      .select('*')
      .limit(1);

    if (tablesError) {
      console.error('   ❌ Database connection failed:', tablesError.message);
      console.error('   Make sure your TEST_SUPABASE_URL and SERVICE_ROLE_KEY are correct.');
      return false;
    }
    console.log('   ✅ Database connection successful\n');

    // Test 2: Check if test user exists
    console.log('2️⃣  Checking if test user exists...');
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(testUserId);

    if (userError || !user) {
      console.error('   ❌ Test user not found with ID:', testUserId);
      console.error('   Please create test user in Supabase Dashboard → Authentication');
      console.error('   Email:', testUserEmail);
      return false;
    }
    console.log('   ✅ Test user found:', user.user.email);
    console.log('   User ID:', user.user.id, '\n');

    // Test 3: Try to authenticate as test user
    console.log('3️⃣  Testing authentication with test user credentials...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testUserEmail,
      password: testUserPassword,
    });

    if (authError) {
      console.error('   ❌ Authentication failed:', authError.message);
      console.error('   Check TEST_USER_EMAIL and TEST_USER_PASSWORD in .env.test');
      return false;
    }
    console.log('   ✅ Authentication successful');
    console.log('   Access token received\n');

    // Test 4: Check if we can query snippets for test user
    console.log('4️⃣  Testing snippet query for test user...');
    const { data: snippets, error: snippetsError } = await supabase
      .from('snippets')
      .select('*')
      .eq('user_id', testUserId);

    if (snippetsError) {
      console.error('   ❌ Query failed:', snippetsError.message);
      console.error('   Make sure RLS policies are set up correctly');
      return false;
    }
    console.log('   ✅ Snippet query successful');
    console.log(`   Found ${snippets?.length || 0} existing snippets for test user\n`);

    // Test 5: Test database write (create and delete)
    console.log('5️⃣  Testing database write operations...');
    const { data: newSnippet, error: createError } = await supabase
      .from('snippets')
      .insert({
        user_id: testUserId,
        title: 'Connection Test Snippet',
        code: 'console.log("test");',
        language: 'javascript',
      })
      .select()
      .single();

    if (createError) {
      console.error('   ❌ Create failed:', createError.message);
      return false;
    }
    console.log('   ✅ Create snippet successful');

    // Clean up test snippet
    const { error: deleteError } = await supabase
      .from('snippets')
      .delete()
      .eq('id', newSnippet.id);

    if (deleteError) {
      console.error('   ⚠️  Delete failed (snippet created but not cleaned up):', deleteError.message);
    } else {
      console.log('   ✅ Delete snippet successful\n');
    }

    return true;
  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

// Run tests
testConnection().then(success => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (success) {
    console.log('✅ ALL TESTS PASSED!');
    console.log('');
    console.log('Your test database is properly configured.');
    console.log('You can now run E2E tests with confidence!');
    console.log('');
    console.log('Run E2E tests:');
    console.log('  npm run test:e2e');
  } else {
    console.log('❌ TESTS FAILED');
    console.log('');
    console.log('Please fix the issues above before running E2E tests.');
    console.log('');
    console.log('Need help? Check:');
    console.log('  - .env.test.example for configuration guidance');
    console.log('  - .ai/e2e-test-plan.md for setup instructions');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  process.exit(success ? 0 : 1);
});
