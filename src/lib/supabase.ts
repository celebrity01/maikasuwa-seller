import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

/**
 * Singleton client — only use for public reads (listings, etc.)
 * Do NOT use for auth operations on API routes, as session state
 * bleeds between requests.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Create a fresh Supabase client for each API route request.
 * This prevents session state from leaking between concurrent requests.
 */
export function createServerClient(): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
