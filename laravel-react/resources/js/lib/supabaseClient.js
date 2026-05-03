import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const browserKey = supabasePublishableKey || supabaseAnonKey;

export const isSupabaseConfigured = Boolean(supabaseUrl && browserKey);

export const supabase = isSupabaseConfigured
    ? createClient(supabaseUrl, browserKey, {
          auth: {
              autoRefreshToken: true,
              detectSessionInUrl: true,
              persistSession: true,
              storageKey: 'inalog-silog-auth',
          },
      })
    : null;
