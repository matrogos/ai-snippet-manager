export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

export interface AIDescriptionRequest {
  code: string;
  language: string;
  snippetId?: string;
}

export interface AIExplanationRequest {
  code: string;
  language: string;
  snippetId?: string;
}

export interface AITagsRequest {
  code: string;
  language: string;
  snippetId?: string;
}

export interface AIDescriptionResponse {
  description: string;
}

export interface AIExplanationResponse {
  explanation: string;
}

export interface AITagsResponse {
  tags: string[];
}
