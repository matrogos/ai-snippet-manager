# AI Code Snippet Manager Database Schema

## 1. Tables

### 1.1. users

This table is managed by Supabase Auth.

- id: UUID PRIMARY KEY
- email: VARCHAR(255) NOT NULL UNIQUE
- encrypted_password: VARCHAR NOT NULL
- created_at: TIMESTAMPTZ NOT NULL DEFAULT now()
- confirmed_at: TIMESTAMPTZ

### 1.2. snippets

- id: UUID PRIMARY KEY DEFAULT uuid_generate_v4()
- user_id: UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- title: VARCHAR(255) NOT NULL
- code: TEXT NOT NULL
- language: VARCHAR(50) NOT NULL
- description: TEXT NULLABLE
- ai_description: TEXT NULLABLE
- ai_explanation: TEXT NULLABLE
- tags: TEXT[] DEFAULT '{}'
- is_favorite: BOOLEAN DEFAULT false
- created_at: TIMESTAMPTZ NOT NULL DEFAULT now()
- updated_at: TIMESTAMPTZ NOT NULL DEFAULT now()

*Constraints:*
- CHECK (LENGTH(TRIM(title)) > 0)
- CHECK (LENGTH(TRIM(code)) > 0)

*Trigger: Automatically update the `updated_at` column on record updates.*

## 2. Relationships

- One user (users) has many snippets (snippets).
- Each snippet (snippets) belongs to exactly one user (users) via user_id.
- When a user is deleted, all their snippets are automatically deleted (CASCADE).

## 3. Indexes

- Index on `user_id` column in snippets table (B-tree).
- Index on `language` column in snippets table (B-tree).
- Index on `tags` column in snippets table (GIN index for array searches).
- Index on `created_at` column in snippets table (B-tree, DESC order).
- Full-text search index on combined `title`, `description`, and `ai_description` (GIN index with to_tsvector).

## 4. RLS Rules (Row-Level Security)

In the snippets table, implement RLS policies that allow users to access only records where `user_id` matches the user identifier from Supabase Auth (auth.uid() = user_id).

**Policies:**
- SELECT: Users can view their own snippets
- INSERT: Users can insert snippets only for themselves
- UPDATE: Users can update only their own snippets
- DELETE: Users can delete only their own snippets

## 5. Additional Notes

- Trigger in snippets table automatically updates the `updated_at` column on every record modification.
- The `tags` column uses PostgreSQL array type (TEXT[]) with GIN indexing for efficient searches.
- Full-text search is implemented using `to_tsvector('english', ...)` on title and description fields.
- The `language` column supports: JavaScript, TypeScript, Python, Java, C#, C++, Go, Rust, PHP, Ruby, SQL, HTML, CSS.
- UUID extension must be enabled: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`