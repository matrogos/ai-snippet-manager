import { supabase } from './supabase';
import type {
  PaginatedSnippetsResponseDTO,
  SnippetListQueryDTO,
  SnippetResponseDTO,
  CreateSnippetRequestDTO,
  UpdateSnippetRequestDTO
} from '@/types/snippet.dto';
import type {
  SuggestTagsRequestDTO,
  SuggestTagsResponseDTO,
  ExplainCodeRequestDTO,
  ExplainCodeResponseDTO
} from '@/types/ai.dto';

/**
 * API Client for making authenticated requests to backend API
 */

/**
 * Build query string from parameters
 */
function buildQueryString(params: SnippetListQueryDTO): string {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) {
    searchParams.append('page', params.page.toString());
  }

  if (params.limit !== undefined) {
    searchParams.append('limit', params.limit.toString());
  }

  if (params.sort) {
    searchParams.append('sort', params.sort);
  }

  if (params.order) {
    searchParams.append('order', params.order);
  }

  if (params.language) {
    searchParams.append('language', params.language);
  }

  if (params.tags) {
    searchParams.append('tags', params.tags);
  }

  if (params.search) {
    searchParams.append('search', params.search);
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Get authenticated headers with JWT token
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Fetch snippets from API
 */
export async function fetchSnippets(
  params: SnippetListQueryDTO = {}
): Promise<PaginatedSnippetsResponseDTO> {
  try {
    const headers = await getAuthHeaders();
    const queryString = buildQueryString(params);
    const url = `/api/snippets${queryString}`;

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch snippets');
    }

    return await response.json();
  } catch (error) {
    console.error('API Client error:', error);
    throw error;
  }
}

/**
 * Fetch a single snippet by ID from API
 */
export async function fetchSnippetById(id: string): Promise<SnippetResponseDTO> {
  try {
    const headers = await getAuthHeaders();
    const url = `/api/snippets/${id}`;

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch snippet');
    }

    return await response.json();
  } catch (error) {
    console.error('API Client error:', error);
    throw error;
  }
}

/**
 * Create a new snippet via API
 */
export async function createSnippet(
  snippet: CreateSnippetRequestDTO
): Promise<SnippetResponseDTO> {
  try {
    const headers = await getAuthHeaders();
    const url = '/api/snippets';

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(snippet),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to create snippet');
    }

    return await response.json();
  } catch (error) {
    console.error('API Client error:', error);
    throw error;
  }
}

/**
 * Update a snippet by ID from API (supports partial updates)
 */
export async function updateSnippet(
  id: string,
  updates: UpdateSnippetRequestDTO
): Promise<SnippetResponseDTO> {
  try {
    const headers = await getAuthHeaders();
    const url = `/api/snippets/${id}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to update snippet');
    }

    return await response.json();
  } catch (error) {
    console.error('API Client error:', error);
    throw error;
  }
}

/**
 * Suggest tags for code using AI
 */
export async function suggestTags(
  request: SuggestTagsRequestDTO
): Promise<SuggestTagsResponseDTO> {
  try {
    const headers = await getAuthHeaders();
    const url = '/api/ai/suggest-tags';

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to suggest tags');
    }

    return await response.json();
  } catch (error) {
    console.error('API Client error:', error);
    throw error;
  }
}

/**
 * Explain code using AI
 */
export async function explainCode(
  request: ExplainCodeRequestDTO
): Promise<ExplainCodeResponseDTO> {
  try {
    const headers = await getAuthHeaders();
    const url = '/api/ai/explain-code';

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to explain code');
    }

    return await response.json();
  } catch (error) {
    console.error('API Client error:', error);
    throw error;
  }
}
