-- =====================================================
-- migration: create snippets table
-- description: creates the core snippets table for the ai code snippet manager
-- affected tables: snippets
-- affected extensions: uuid-ossp
-- author: ai code snippet manager
-- date: 2025-10-19
-- =====================================================
--
-- this migration creates:
-- 1. snippets table with all required columns and constraints
-- 2. indexes for performance optimization (user_id, language, tags, created_at, full-text search)
-- 3. row level security (rls) policies for authenticated users
-- 4. trigger function to automatically update the updated_at timestamp
--
-- dependencies:
-- - requires auth.users table (provided by supabase auth)
-- - requires uuid-ossp extension for uuid generation
--
-- security:
-- - rls enabled on snippets table
-- - users can only access their own snippets (auth.uid() = user_id)
-- =====================================================

-- enable uuid extension for generating uuids
-- this is idempotent and safe to run multiple times
create extension if not exists "uuid-ossp";

-- =====================================================
-- table: snippets
-- purpose: stores code snippets created by users with ai-generated metadata
-- =====================================================
create table if not exists public.snippets (
  -- primary identifier
  id uuid primary key default uuid_generate_v4(),

  -- foreign key to auth.users (managed by supabase auth)
  -- cascade delete ensures snippets are removed when user is deleted
  user_id uuid not null references auth.users(id) on delete cascade,

  -- snippet metadata
  title varchar(255) not null,
  code text not null,
  language varchar(50) not null,

  -- optional description fields
  -- description: user-provided description
  -- ai_description: ai-generated summary
  -- ai_explanation: ai-generated detailed explanation
  description text,
  ai_description text,
  ai_explanation text,

  -- tags stored as postgresql array for efficient querying
  tags text[] default '{}',

  -- favorite flag for user bookmarking
  is_favorite boolean default false,

  -- timestamps for tracking creation and updates
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- constraints to ensure data integrity
  -- prevent empty titles and code
  constraint title_not_empty check (length(trim(title)) > 0),
  constraint code_not_empty check (length(trim(code)) > 0)
);

-- =====================================================
-- indexes for performance optimization
-- =====================================================

-- b-tree index on user_id for fast filtering by user
-- used in: queries filtering snippets by user, rls policy checks
create index if not exists idx_snippets_user_id
  on public.snippets(user_id);

-- b-tree index on language for filtering by programming language
-- used in: queries filtering snippets by language
create index if not exists idx_snippets_language
  on public.snippets(language);

-- gin index on tags array for efficient array searches
-- used in: queries searching for specific tags or combinations
-- supports operations like: tags @> array['tag1'], tags && array['tag1', 'tag2']
create index if not exists idx_snippets_tags
  on public.snippets using gin(tags);

-- b-tree index on created_at in descending order
-- used in: sorting snippets by creation date (newest first)
create index if not exists idx_snippets_created_at
  on public.snippets(created_at desc);

-- gin index for full-text search across title and description fields
-- used in: full-text search queries across snippet content
-- searches title, user description, and ai-generated description
create index if not exists idx_snippets_search
  on public.snippets
  using gin(
    to_tsvector('english',
      title || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(ai_description, '')
    )
  );

-- =====================================================
-- trigger function: auto-update updated_at timestamp
-- =====================================================

-- this function automatically sets updated_at to current timestamp
-- whenever a row is updated in any table using this trigger
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- attach trigger to snippets table
-- fires before each update operation on a row
drop trigger if exists update_snippets_updated_at on public.snippets;
create trigger update_snippets_updated_at
  before update on public.snippets
  for each row
  execute function public.update_updated_at_column();

-- =====================================================
-- row level security (rls)
-- =====================================================

-- enable rls on snippets table
-- this ensures all queries are filtered by rls policies
alter table public.snippets enable row level security;

-- drop existing policies if they exist (for idempotent migrations)
drop policy if exists "authenticated users can select own snippets" on public.snippets;
drop policy if exists "authenticated users can insert own snippets" on public.snippets;
drop policy if exists "authenticated users can update own snippets" on public.snippets;
drop policy if exists "authenticated users can delete own snippets" on public.snippets;

-- =====================================================
-- rls policy: select (read access)
-- purpose: allow authenticated users to view only their own snippets
-- roles: authenticated
-- =====================================================
create policy "authenticated users can select own snippets"
  on public.snippets
  for select
  to authenticated
  using (auth.uid() = user_id);

-- =====================================================
-- rls policy: insert (create access)
-- purpose: allow authenticated users to create snippets for themselves only
-- roles: authenticated
-- security: with check ensures user_id matches authenticated user
-- =====================================================
create policy "authenticated users can insert own snippets"
  on public.snippets
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- =====================================================
-- rls policy: update (modify access)
-- purpose: allow authenticated users to update only their own snippets
-- roles: authenticated
-- security: using clause filters rows, with check validates new data
-- =====================================================
create policy "authenticated users can update own snippets"
  on public.snippets
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =====================================================
-- rls policy: delete (remove access)
-- purpose: allow authenticated users to delete only their own snippets
-- roles: authenticated
-- =====================================================
create policy "authenticated users can delete own snippets"
  on public.snippets
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- =====================================================
-- migration complete
-- =====================================================
-- next steps:
-- 1. run this migration using: supabase db push
-- 2. verify table creation: select * from snippets limit 1;
-- 3. verify rls policies: \d snippets
-- =====================================================
