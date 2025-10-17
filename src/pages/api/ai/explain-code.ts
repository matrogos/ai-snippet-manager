import type { APIRoute } from 'astro';
import { explainCode } from '@/lib/openai';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { code, language } = await request.json();

    if (!code || !language) {
      return new Response(
        JSON.stringify({ error: 'Code and language are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const explanation = await explainCode(code, language);

    return new Response(
      JSON.stringify({ explanation }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Explain code error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to explain code' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
