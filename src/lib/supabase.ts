import { createClient } from '@supabase/supabase-js';
import type { User } from '@/types/user';
import type { Snippet, CreateSnippetInput, UpdateSnippetInput } from '@/types/snippet';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============ Authentication ============

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  return {
    id: user.id,
    email: user.email!,
    created_at: user.created_at,
  };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${import.meta.env.PUBLIC_APP_URL}/reset-password`,
  });
  return { data, error };
}

// ============ Snippets CRUD ============

export async function getSnippets(userId: string, page = 1, limit = 20): Promise<Snippet[]> {
  const { data, error } = await supabase
    .from('snippets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (error) throw error;
  return data as Snippet[];
}

export async function getSnippetById(id: string): Promise<Snippet | null> {
  const { data, error } = await supabase
    .from('snippets')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data as Snippet;
}

export async function createSnippet(input: CreateSnippetInput & { user_id: string }): Promise<Snippet> {
  const { data, error } = await supabase
    .from('snippets')
    .insert({
      user_id: input.user_id,
      title: input.title,
      code: input.code,
      language: input.language,
      description: input.description,
      tags: input.tags || [],
    })
    .select()
    .single();

  if (error) throw error;
  return data as Snippet;
}

export async function updateSnippet(input: UpdateSnippetInput): Promise<Snippet> {
  const { id, ...updates } = input;

  const { data, error } = await supabase
    .from('snippets')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Snippet;
}

export async function deleteSnippet(id: string): Promise<void> {
  const { error } = await supabase
    .from('snippets')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============ Search & Filter ============

export async function searchSnippets(
  userId: string,
  query: string,
  language?: string,
  tags?: string[]
): Promise<Snippet[]> {
  let queryBuilder = supabase
    .from('snippets')
    .select('*')
    .eq('user_id', userId);

  if (query) {
    queryBuilder = queryBuilder.or(
      `title.ilike.%${query}%,description.ilike.%${query}%,ai_description.ilike.%${query}%`
    );
  }

  if (language) {
    queryBuilder = queryBuilder.eq('language', language);
  }

  if (tags && tags.length > 0) {
    queryBuilder = queryBuilder.contains('tags', tags);
  }

  const { data, error } = await queryBuilder.order('created_at', { ascending: false });

  if (error) throw error;
  return data as Snippet[];
}
