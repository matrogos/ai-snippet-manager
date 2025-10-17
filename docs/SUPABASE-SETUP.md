# Supabase Database Setup Guide

## Prerequisites
- Supabase account (free tier is fine)
- Supabase project already created (based on your .env.local)

## Step-by-Step Instructions

### 1. Access Supabase SQL Editor
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: `zdcmiqrrcbiygeocloti`
3. Click on **SQL Editor** in the left sidebar
4. Or go directly to: https://app.supabase.com/project/zdcmiqrrcbiygeocloti/sql

### 2. Run Database Schema
1. Open the file: `docs/database-schema.sql`
2. Copy the **entire contents** of the file
3. Paste it into the Supabase SQL Editor
4. Click the **"Run"** button (or press Ctrl/Cmd + Enter)

### 3. Verify Setup
After running the schema, verify the following:

#### Check Tables Created
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```
You should see: `snippets`

#### Check RLS Policies
```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'snippets';
```
You should see 4 policies:
- Users can view own snippets
- Users can insert own snippets
- Users can update own snippets
- Users can delete own snippets

#### Check Indexes
```sql
SELECT indexname
FROM pg_indexes
WHERE tablename = 'snippets';
```
You should see indexes for: user_id, language, tags, created_at, search

### 4. Test Authentication
Your Supabase Auth is already configured with:
- Email/Password authentication enabled
- Auto-confirm users (or email confirmation)

To verify:
1. Go to **Authentication** → **Settings** in Supabase
2. Ensure **Email** provider is enabled
3. For development, you can disable email confirmation

### 5. What's Next?
Once the database is set up, you can:
1. Test user registration at `http://localhost:4321/register`
2. Test login at `http://localhost:4321/login`
3. Access the dashboard (after login)

## Troubleshooting

### "relation already exists" error
This is normal if you run the schema multiple times. The script uses `IF NOT EXISTS` and `DROP IF EXISTS` to handle this.

### RLS blocking your queries
Make sure you're authenticated when testing. The Row-Level Security policies ensure users can only access their own snippets.

### Can't create users
Check that email provider is enabled in **Authentication** → **Providers** → **Email**

## Database Schema Overview

**Table: snippets**
- `id` - UUID (primary key)
- `user_id` - UUID (foreign key to auth.users)
- `title` - VARCHAR(255)
- `code` - TEXT
- `language` - VARCHAR(50)
- `description` - TEXT (optional)
- `ai_description` - TEXT (AI-generated)
- `ai_explanation` - TEXT (AI-generated)
- `tags` - TEXT[] (array)
- `is_favorite` - BOOLEAN
- `created_at` - TIMESTAMP
- `updated_at` - TIMESTAMP (auto-updated)

**Security:**
- Row-Level Security (RLS) enabled
- Users can only CRUD their own snippets
- Enforced at database level

**Performance:**
- Indexes on user_id, language, tags, created_at
- Full-text search index on title + descriptions
