import type { APIRoute } from 'astro';
import { suggestTags } from '@/lib/openai';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { code, language } = await request.json();

    if (!code || !language) {
      return new Response(
        JSON.stringify({ error: 'Code and language are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const tags = await suggestTags(code, language);

    return new Response(
      JSON.stringify({ tags }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Suggest tags error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to suggest tags' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
