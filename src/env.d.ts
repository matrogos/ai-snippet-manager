/// <reference types="astro/client" />

// CSS module declarations for Prism themes
declare module 'prismjs/themes/*.css' {
  const content: string;
  export default content;
}

// Astro middleware module declaration
declare module 'astro:middleware' {
  export function defineMiddleware(
    middleware: (context: any, next: () => Promise<Response>) => Promise<Response>
  ): any;
  export function sequence(...handlers: any[]): any;
}

// Extend ImportMeta interface to include env
interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  readonly OPENAI_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
