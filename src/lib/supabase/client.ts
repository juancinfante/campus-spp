import { createBrowserClient } from '@supabase/ssr';

// Cliente para Client Components (formularios interactivos, realtime, etc.)
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
