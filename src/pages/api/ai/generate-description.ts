import type { APIRoute } from 'astro';
import { generateDescription } from '@/lib/openai';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { code, language } = await request.json();

    if (!code || !language) {
      return new Response(
        JSON.stringify({ error: 'Code and language are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const description = await generateDescription(code, language);

    return new Response(
      JSON.stringify({ description }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Generate description error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate description' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
