import type { APIRoute } from 'astro';
import { signOut } from '@/lib/supabase';

export const POST: APIRoute = async ({ redirect }) => {
  await signOut();
  return redirect('/login');
};
