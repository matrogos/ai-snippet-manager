import { createClient } from '@supabase/supabase-js';
import type {
  GetSnippetsCommand,
  GetSnippetByIdCommand,
  DeleteSnippetCommand,
  SnippetResponseDTO,
  PaginatedSnippetsResponseDTO,
  DeleteSnippetResponseDTO,
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
   * Delete a snippet by ID for a user
   * Returns DeleteSnippetResponseDTO if successful, null if not found or doesn't belong to user
   */
  static async deleteSnippet(
    command: DeleteSnippetCommand,
    accessToken: string
  ): Promise<DeleteSnippetResponseDTO | null> {
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

      // Delete snippet by ID and user_id for security
      // RLS policies will also enforce this at database level
      const { error, count } = await supabase
        .from('snippets')
        .delete({ count: 'exact' })
        .eq('id', command.id)
        .eq('user_id', command.user_id);

      if (error) {
        console.error('Database error in deleteSnippet:', error);
        throw error;
      }

      // If no rows were affected, snippet not found or doesn't belong to user
      if (!count || count === 0) {
        return null;
      }

      // Return success response
      return {
        message: 'Snippet deleted successfully',
        id: command.id,
      };
    } catch (error) {
      console.error('Service error in deleteSnippet:', error);
      throw error;
    }
  }
}
