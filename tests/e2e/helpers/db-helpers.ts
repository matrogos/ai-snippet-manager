/**
 * Database helper functions for E2E tests
 *
 * These helpers interact directly with the test database using
 * the service role key to set up and clean up test data.
 *
 * IMPORTANT: Only use service role key in test environment!
 * Never expose this key in browser code.
 */

import { createClient } from '@supabase/supabase-js';
import { TEST_SUPABASE_CONFIG, TEST_USER } from '../fixtures/auth';

// Create Supabase client with service role key (bypasses RLS)
const supabaseAdmin = createClient(
  TEST_SUPABASE_CONFIG.url,
  TEST_SUPABASE_CONFIG.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Snippet data for creating test snippets
 */
export interface TestSnippetData {
  title: string;
  code: string;
  language: string;
  description?: string;
  tags?: string[];
  is_favorite?: boolean;
  ai_description?: string;
  ai_explanation?: string;
}

/**
 * Create a test snippet in the database
 * Uses service role to bypass RLS
 *
 * @param userId - User ID who owns the snippet
 * @param data - Snippet data
 * @returns Created snippet
 */
export async function createTestSnippet(
  userId: string,
  data: TestSnippetData
) {
  const { data: snippet, error } = await supabaseAdmin
    .from('snippets')
    .insert({
      user_id: userId,
      title: data.title,
      code: data.code,
      language: data.language,
      description: data.description || null,
      tags: data.tags || [],
      is_favorite: data.is_favorite || false,
      ai_description: data.ai_description || null,
      ai_explanation: data.ai_explanation || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create test snippet:', error);
    throw error;
  }

  return snippet;
}

/**
 * Create multiple test snippets at once
 *
 * @param userId - User ID who owns the snippets
 * @param snippetsData - Array of snippet data
 * @returns Array of created snippets
 */
export async function createTestSnippets(
  userId: string,
  snippetsData: TestSnippetData[]
) {
  const snippets = snippetsData.map((data) => ({
    user_id: userId,
    title: data.title,
    code: data.code,
    language: data.language,
    description: data.description || null,
    tags: data.tags || [],
    is_favorite: data.is_favorite || false,
    ai_description: data.ai_description || null,
    ai_explanation: data.ai_explanation || null,
  }));

  const { data, error } = await supabaseAdmin
    .from('snippets')
    .insert(snippets)
    .select();

  if (error) {
    console.error('Failed to create test snippets:', error);
    throw error;
  }

  return data;
}

/**
 * Delete all snippets for a specific user
 * Useful for cleaning up after tests
 *
 * @param userId - User ID whose snippets to delete
 */
export async function cleanupTestSnippets(userId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('snippets')
    .delete()
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to cleanup test snippets:', error);
    throw error;
  }
}

/**
 * Delete a specific snippet by ID
 *
 * @param snippetId - ID of the snippet to delete
 */
export async function deleteTestSnippet(snippetId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('snippets')
    .delete()
    .eq('id', snippetId);

  if (error) {
    console.error('Failed to delete test snippet:', error);
    throw error;
  }
}

/**
 * Get all snippets for a specific user
 *
 * @param userId - User ID whose snippets to retrieve
 * @returns Array of snippets
 */
export async function getTestUserSnippets(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('snippets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to get test user snippets:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get a specific snippet by ID
 *
 * @param snippetId - Snippet ID
 * @returns Snippet or null
 */
export async function getTestSnippet(snippetId: string) {
  const { data, error } = await supabaseAdmin
    .from('snippets')
    .select('*')
    .eq('id', snippetId)
    .single();

  if (error) {
    console.error('Failed to get test snippet:', error);
    return null;
  }

  return data;
}

/**
 * Clean up all snippets for the primary test user
 * Convenience function for most common cleanup scenario
 */
export async function cleanupPrimaryTestUserSnippets(): Promise<void> {
  await cleanupTestSnippets(TEST_USER.id);
}

/**
 * Sample test snippets for use in tests
 */
export const SAMPLE_SNIPPETS: TestSnippetData[] = [
  {
    title: 'Array Sort Function',
    code: 'function sortArray(arr) {\n  return arr.sort((a, b) => a - b);\n}',
    language: 'javascript',
    description: 'Sorts an array of numbers in ascending order',
    tags: ['javascript', 'array', 'sort'],
    is_favorite: false,
  },
  {
    title: 'SQL Query Example',
    code: 'SELECT * FROM users WHERE id = 1;',
    language: 'sql',
    description: 'Simple SQL query to fetch a user',
    tags: ['sql', 'database', 'query'],
    is_favorite: true,
  },
  {
    title: 'Python Hello World',
    code: 'print("Hello, World!")',
    language: 'python',
    description: 'Classic Hello World in Python',
    tags: ['python', 'hello-world'],
    is_favorite: false,
  },
];

/**
 * Update a snippet
 *
 * @param snippetId - Snippet ID to update
 * @param updates - Partial snippet data to update
 */
export async function updateTestSnippet(
  snippetId: string,
  updates: Partial<TestSnippetData>
) {
  const { data, error } = await supabaseAdmin
    .from('snippets')
    .update(updates)
    .eq('id', snippetId)
    .select()
    .single();

  if (error) {
    console.error('Failed to update test snippet:', error);
    throw error;
  }

  return data;
}

/**
 * Count snippets for a user
 *
 * @param userId - User ID
 * @returns Number of snippets
 */
export async function countUserSnippets(userId: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('snippets')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to count user snippets:', error);
    throw error;
  }

  return count || 0;
}
