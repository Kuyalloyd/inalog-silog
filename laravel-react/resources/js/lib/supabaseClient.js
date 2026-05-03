import { createClient } from '@supabase/supabase-js';

// Supabase browser keys are public by design, so we keep safe fallbacks here
// to prevent production logins from breaking if a deployment misses Vercel vars.
const DEFAULT_SUPABASE_URL = 'https://ooahwwcztbrjkdhxflvk.supabase.co';
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable__ylp5gBNCMN8_UZJmMEifg_BB4sk5K6';
const DEFAULT_SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsImtpZCI6IkNxN3V5bDZaYktsN0Z2cGMiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL29vYWh3d2N6dGJyamtkaHhmbHZrLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJyZWYiOiJvb2Fod3djenRicmprZGh4Zmx2ayIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzQ1ODk3OTM4LCJleHAiOjIwNjE0NzM5Mzh9.ZeIfXmwEmNHjPohiGWsC-cnoUDcYQEdrwEPL9Zv_JUw';

const runtimeSupabaseConfig = typeof window !== 'undefined' ? window.__INALOG_SUPABASE_CONFIG__ || {} : {};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || runtimeSupabaseConfig.url || DEFAULT_SUPABASE_URL;
const supabasePublishableKey =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || runtimeSupabaseConfig.publishableKey || DEFAULT_SUPABASE_PUBLISHABLE_KEY;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || runtimeSupabaseConfig.anonKey || DEFAULT_SUPABASE_ANON_KEY;

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
