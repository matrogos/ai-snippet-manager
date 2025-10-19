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
 * Standard error response format
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}
