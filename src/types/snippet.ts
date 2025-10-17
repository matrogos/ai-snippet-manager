export interface Snippet {
  id: string;
  user_id: string;
  title: string;
  code: string;
  language: string;
  description?: string;
  ai_description?: string;
  ai_explanation?: string;
  tags: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSnippetInput {
  title: string;
  code: string;
  language: string;
  description?: string;
  tags?: string[];
}

export interface UpdateSnippetInput extends Partial<CreateSnippetInput> {
  id: string;
  ai_description?: string;
  ai_explanation?: string;
  is_favorite?: boolean;
}
