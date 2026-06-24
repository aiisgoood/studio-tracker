import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Supports both the new "publishable" key name and the older "anon" name.
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Supabase client. Null until env vars are set (so the app still builds
 * before the database is connected).
 */
export const supabase = url && key ? createClient(url, key) : null;

export const isSupabaseReady = Boolean(url && key);
