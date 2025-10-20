// DTO types for API endpoints

/**
 * Query parameters for GET /api/snippets
 */
export interface SnippetListQueryDTO {
  page?: number;
  limit?: number;
  sort?: 'created_at' | 'updated_at' | 'title';
  order?: 'asc' | 'desc';
  language?: string;
  tags?: string; // Comma-separated list
  search?: string;
}

/**
 * Response DTO for individual snippet (extends Snippet for compatibility)
 */
export interface SnippetResponseDTO {
  id: string;
  user_id: string;
  title: string;
  code: string;
  language: string;
  description: string | null;
  ai_description: string | null;
  ai_explanation: string | null;
  tags: string[];
  is_favorite: boolean;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

/**
 * Pagination metadata
 */
export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

/**
 * Paginated response for GET /api/snippets
 */
export interface PaginatedSnippetsResponseDTO {
  data: SnippetResponseDTO[];
  pagination: PaginationMetadata;
}

/**
 * Service command model for getting snippets
 */
export interface GetSnippetsCommand {
  user_id: string;
  page: number;
  limit: number;
  sort: string;
  order: 'asc' | 'desc';
  language?: string;
  tags?: string[];
  search?: string;
}

/**
 * Path parameter for GET /api/snippets/{id}
 */
export interface SnippetIdParamDTO {
  id: string; // UUID format
}

/**
 * Service command model for getting snippet by ID
 */
export interface GetSnippetByIdCommand {
  id: string;
  user_id: string;
}

/**
 * Request DTO for POST /api/snippets
 */
export interface CreateSnippetRequestDTO {
  title: string;
  code: string;
  language: string;
  description?: string | null;
  tags?: string[];
  ai_description?: string | null;
  ai_explanation?: string | null;
}

/**
 * Service command model for creating a snippet
 */
export interface CreateSnippetCommand {
  user_id: string;
  title: string;
  code: string;
  language: string;
  description?: string | null;
  tags: string[];
  ai_description?: string | null;
  ai_explanation?: string | null;
}

/**
 * Request DTO for PUT /api/snippets/{id} (partial update support)
 */
export interface UpdateSnippetRequestDTO {
  title?: string;
  code?: string;
  language?: string;
  description?: string | null;
  tags?: string[];
  ai_description?: string | null;
  ai_explanation?: string | null;
  is_favorite?: boolean;
}

/**
 * Service command model for updating a snippet
 */
export interface UpdateSnippetCommand {
  id: string;
  user_id: string;
  updates: {
    title?: string;
    code?: string;
    language?: string;
    description?: string | null;
    tags?: string[];
    ai_description?: string | null;
    ai_explanation?: string | null;
    is_favorite?: boolean;
  };
}

/**
 * Standard error response format
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}
