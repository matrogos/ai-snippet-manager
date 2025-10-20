import { createClient } from '@supabase/supabase-js';
import type {
  GetSnippetsCommand,
  GetSnippetByIdCommand,
  CreateSnippetCommand,
  UpdateSnippetCommand,
  SnippetResponseDTO,
  PaginatedSnippetsResponseDTO,
} from '@/types/snippet.dto';

/**
 * Service layer for snippet operations
 */
export class SnippetService {
  /**
   * Get paginated, filtered, and sorted snippets for a user
   */
  static async getSnippets(
    command: GetSnippetsCommand,
    accessToken: string
  ): Promise<PaginatedSnippetsResponseDTO> {
    try {
      // Create authenticated Supabase client with the user's token
      const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      });

      // Build base query
      let query = supabase
        .from('snippets')
        .select('*', { count: 'exact' })
        .eq('user_id', command.user_id);

      // Apply language filter
      if (command.language) {
        query = query.eq('language', command.language);
      }

      // Apply tags filter (array overlap - matches if any tag matches)
      if (command.tags && command.tags.length > 0) {
        query = query.overlaps('tags', command.tags);
      }

      // Apply full-text search
      if (command.search) {
        // Use PostgreSQL full-text search on the indexed column
        // Search across title, description, and ai_description
        query = query.textSearch(
          'title,description,ai_description',
          command.search,
          {
            type: 'websearch',
            config: 'english',
          }
        );
      }

      // Apply sorting
      const ascending = command.order === 'asc';
      query = query.order(command.sort, { ascending });

      // Apply pagination
      const from = (command.page - 1) * command.limit;
      const to = from + command.limit - 1;
      query = query.range(from, to);

      // Execute query
      const { data, error, count } = await query;

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      // Calculate pagination metadata
      const total = count || 0;
      const total_pages = Math.ceil(total / command.limit);

      // Transform to DTOs
      const snippets: SnippetResponseDTO[] = (data || []).map((snippet) => ({
        id: snippet.id,
        user_id: snippet.user_id,
        title: snippet.title,
        code: snippet.code,
        language: snippet.language,
        description: snippet.description || null,
        ai_description: snippet.ai_description || null,
        ai_explanation: snippet.ai_explanation || null,
        tags: snippet.tags || [],
        is_favorite: snippet.is_favorite || false,
        created_at: snippet.created_at,
        updated_at: snippet.updated_at,
      }));

      return {
        data: snippets,
        pagination: {
          page: command.page,
          limit: command.limit,
          total,
          total_pages,
        },
      };
    } catch (error) {
      console.error('Service error in getSnippets:', error);
      throw error;
    }
  }

  /**
   * Get a specific snippet by ID for a user
   * Returns null if snippet not found or doesn't belong to the user
   */
  static async getSnippetById(
    command: GetSnippetByIdCommand,
    accessToken: string
  ): Promise<SnippetResponseDTO | null> {
    try {
      // Create authenticated Supabase client with the user's token
      const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      });

      // Query snippet by ID and user_id for security
      const { data, error } = await supabase
        .from('snippets')
        .select('*')
        .eq('id', command.id)
        .eq('user_id', command.user_id)
        .single();

      if (error) {
        // If error is "not found", return null (don't throw)
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Database error in getSnippetById:', error);
        throw error;
      }

      // Return null if no data found
      if (!data) {
        return null;
      }

      // Transform to DTO
      return {
        id: data.id,
        user_id: data.user_id,
        title: data.title,
        code: data.code,
        language: data.language,
        description: data.description || null,
        ai_description: data.ai_description || null,
        ai_explanation: data.ai_explanation || null,
        tags: data.tags || [],
        is_favorite: data.is_favorite || false,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    } catch (error) {
      console.error('Service error in getSnippetById:', error);
      throw error;
    }
  }

  /**
   * Create a new snippet for a user
   * Returns created SnippetResponseDTO with auto-generated ID and timestamps
   */
  static async createSnippet(
    command: CreateSnippetCommand,
    accessToken: string
  ): Promise<SnippetResponseDTO> {
    try {
      // Create authenticated Supabase client with the user's token
      const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      });

      // Insert new snippet
      // Database will auto-generate: id (UUID), created_at, updated_at
      // Database will set default: is_favorite = false
      const { data, error } = await supabase
        .from('snippets')
        .insert({
          user_id: command.user_id,
          title: command.title,
          code: command.code,
          language: command.language,
          description: command.description,
          tags: command.tags,
          ai_description: command.ai_description,
          ai_explanation: command.ai_explanation,
        })
        .select()
        .single();

      if (error) {
        console.error('Database error in createSnippet:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Failed to create snippet - no data returned');
      }

      // Transform to DTO
      return {
        id: data.id,
        user_id: data.user_id,
        title: data.title,
        code: data.code,
        language: data.language,
        description: data.description || null,
        ai_description: data.ai_description || null,
        ai_explanation: data.ai_explanation || null,
        tags: data.tags || [],
        is_favorite: data.is_favorite || false,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    } catch (error) {
      console.error('Service error in createSnippet:', error);
      throw error;
    }
  }

  /**
   * Update a snippet by ID for a user (supports partial updates)
   * Returns updated SnippetResponseDTO if successful, null if not found or doesn't belong to user
   */
  static async updateSnippet(
    command: UpdateSnippetCommand,
    accessToken: string
  ): Promise<SnippetResponseDTO | null> {
    try {
      // Create authenticated Supabase client with the user's token
      const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      });

      // First verify the snippet exists and belongs to the user
      const { data: existingSnippet, error: checkError } = await supabase
        .from('snippets')
        .select('id')
        .eq('id', command.id)
        .eq('user_id', command.user_id)
        .single();

      if (checkError) {
        // If error is "not found", return null (don't throw)
        if (checkError.code === 'PGRST116') {
          return null;
        }
        console.error('Database error in updateSnippet (check):', checkError);
        throw checkError;
      }

      if (!existingSnippet) {
        return null;
      }

      // Update the snippet with provided fields
      // Supabase will automatically update the updated_at timestamp via trigger
      const { data, error } = await supabase
        .from('snippets')
        .update(command.updates)
        .eq('id', command.id)
        .eq('user_id', command.user_id)
        .select()
        .single();

      if (error) {
        console.error('Database error in updateSnippet:', error);
        throw error;
      }

      if (!data) {
        return null;
      }

      // Transform to DTO
      return {
        id: data.id,
        user_id: data.user_id,
        title: data.title,
        code: data.code,
        language: data.language,
        description: data.description || null,
        ai_description: data.ai_description || null,
        ai_explanation: data.ai_explanation || null,
        tags: data.tags || [],
        is_favorite: data.is_favorite || false,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    } catch (error) {
      console.error('Service error in updateSnippet:', error);
      throw error;
    }
  }
}
