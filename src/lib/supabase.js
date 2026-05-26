import { createClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

/**
 * Gunakan createBrowserClient dari @supabase/ssr agar sesi tersimpan
 * di COOKIE (bukan hanya localStorage), sehingga bisa dibaca oleh
 * Next.js Middleware di sisi server.
 *
 * Drop-in replacement: API-nya identik dengan createClient biasa.
 */
export const supabase = isSupabaseConfigured
  ? createBrowserClient(supabaseUrl, supabaseKey)
  : null;
