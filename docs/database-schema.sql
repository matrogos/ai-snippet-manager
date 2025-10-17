-- AI Code Snippet Manager - Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create snippets table
CREATE TABLE IF NOT EXISTS snippets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  code TEXT NOT NULL,
  language VARCHAR(50) NOT NULL,
  description TEXT,
  ai_description TEXT,
  ai_explanation TEXT,
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT title_not_empty CHECK (LENGTH(TRIM(title)) > 0),
  CONSTRAINT code_not_empty CHECK (LENGTH(TRIM(code)) > 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_snippets_user_id ON snippets(user_id);
CREATE INDEX IF NOT EXISTS idx_snippets_language ON snippets(language);
CREATE INDEX IF NOT EXISTS idx_snippets_tags ON snippets USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_snippets_created_at ON snippets(created_at DESC);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_snippets_search ON snippets
  USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || COALESCE(ai_description, '')));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_snippets_updated_at ON snippets;
CREATE TRIGGER update_snippets_updated_at
  BEFORE UPDATE ON snippets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE snippets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own snippets" ON snippets;
DROP POLICY IF EXISTS "Users can insert own snippets" ON snippets;
DROP POLICY IF EXISTS "Users can update own snippets" ON snippets;
DROP POLICY IF EXISTS "Users can delete own snippets" ON snippets;

-- RLS Policies: Users can only view their own snippets
CREATE POLICY "Users can view own snippets"
  ON snippets
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies: Users can insert their own snippets
CREATE POLICY "Users can insert own snippets"
  ON snippets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies: Users can update their own snippets
CREATE POLICY "Users can update own snippets"
  ON snippets
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies: Users can delete their own snippets
CREATE POLICY "Users can delete own snippets"
  ON snippets
  FOR DELETE
  USING (auth.uid() = user_id);
