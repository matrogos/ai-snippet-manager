import { createClient } from '@supabase/supabase-js';
import type {
  GetSnippetsCommand,
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
}
