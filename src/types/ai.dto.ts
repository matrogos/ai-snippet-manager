// DTO types for AI API endpoints

/**
 * Request DTO for POST /api/ai/suggest-tags
 */
export interface SuggestTagsRequestDTO {
  code: string;
  language: string;
}

/**
 * Response DTO for POST /api/ai/suggest-tags
 */
export interface SuggestTagsResponseDTO {
  tags: string[];
}

/**
 * Service command model for suggesting tags
 */
export interface SuggestTagsCommand {
  code: string;
  language: string;
  user_id: string; // For rate limiting tracking
}

/**
 * Request DTO for POST /api/ai/explain-code
 */
export interface ExplainCodeRequestDTO {
  code: string;
  language: string;
}

/**
 * Response DTO for POST /api/ai/explain-code
 */
export interface ExplainCodeResponseDTO {
  explanation: string;
}

/**
 * Service command model for explaining code
 */
export interface ExplainCodeCommand {
  code: string;
  language: string;
  user_id: string; // For rate limiting tracking
}

/**
 * Request DTO for POST /api/ai/generate-description
 */
export interface GenerateDescriptionRequestDTO {
  code: string;
  language: string;
}

/**
 * Response DTO for POST /api/ai/generate-description
 */
export interface GenerateDescriptionResponseDTO {
  description: string;
}

/**
 * Service command model for generating description
 */
export interface GenerateDescriptionCommand {
  code: string;
  language: string;
  user_id: string; // For rate limiting tracking
}
