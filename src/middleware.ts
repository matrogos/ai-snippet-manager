import { defineMiddleware } from 'astro:middleware';

// Middleware is disabled for now since Supabase session is client-side only
// Auth checks are done in individual pages
export const onRequest = defineMiddleware(async (context, next) => {
  return next();
});
