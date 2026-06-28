/**
 * Centralized access to public env vars. Expo inlines EXPO_PUBLIC_* at build time.
 * Values are validated lazily so the app can boot in Phase 0 before Supabase exists.
 */
export const env = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
};

export function assertSupabaseEnv(): void {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error(
      "Missing Supabase env. Copy .env.example to .env and set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
}
