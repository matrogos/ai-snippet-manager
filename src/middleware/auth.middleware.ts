import { supabase } from '@/lib/supabase';
import type { APIContext } from 'astro';

/**
 * Authentication result
 */
export interface AuthResult {
  success: boolean;
  user_id?: string;
  access_token?: string;
  error?: string;
}

/**
 * Extract and validate JWT token from Authorization header
 * Returns user_id if valid, null if invalid/missing
 */
export async function authenticate(request: Request): Promise<AuthResult> {
  try {
    // Extract Authorization header
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return {
        success: false,
        error: 'Missing authentication token',
      };
    }

    // Check Bearer token format
    if (!authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'Invalid authentication token format',
      };
    }

    // Extract token
    const token = authHeader.substring(7);

    if (!token) {
      return {
        success: false,
        error: 'Missing authentication token',
      };
    }

    // Validate token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return {
        success: false,
        error: 'Invalid or expired authentication token',
      };
    }

    // Return user_id and token
    return {
      success: true,
      user_id: user.id,
      access_token: token,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: 'Authentication failed',
    };
  }
}

/**
 * Middleware function for API routes
 * Returns user_id and access_token if authenticated, throws 401 response if not
 */
export async function requireAuth(context: APIContext): Promise<{ user_id: string; access_token: string }> {
  const result = await authenticate(context.request);

  if (!result.success) {
    throw new Response(
      JSON.stringify({
        error: {
          code: 'UNAUTHORIZED',
          message: result.error || 'Authentication required',
        },
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return {
    user_id: result.user_id!,
    access_token: result.access_token!,
  };
}
