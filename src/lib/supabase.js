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
  ? (typeof window !== "undefined"
      ? createBrowserClient(supabaseUrl, supabaseKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
          },
        })
      : createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false },
        }))
  : null;

export async function waitForSupabaseUser(maxRetries = 6, delayMs = 120) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const result = await supabase.auth.getUser();
    if (result.error || result.data?.user) {
      return result;
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return supabase.auth.getUser();
}
