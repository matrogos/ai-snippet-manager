import { defineMiddleware } from 'astro:middleware';
import { getCurrentUser } from './lib/supabase';

export const onRequest = defineMiddleware(async (context, next) => {
  const protectedRoutes = ['/dashboard', '/snippet'];
  const authRoutes = ['/login', '/register'];
  const path = new URL(context.request.url).pathname;

  // Check if user is authenticated
  const user = await getCurrentUser();

  // Redirect authenticated users away from auth pages
  if (user && authRoutes.some((route) => path.startsWith(route))) {
    return context.redirect('/dashboard');
  }

  // Redirect unauthenticated users to login
  if (!user && protectedRoutes.some((route) => path.startsWith(route))) {
    return context.redirect('/login');
  }

  return next();
});
