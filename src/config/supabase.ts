import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";
import { Database } from "../types/database";
import { env } from "./env";

export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey);

// Fall back to harmless placeholders when .env is not set yet, so the app can
// still boot and show a setup hint (instead of crashing at import time).
const url = env.supabaseUrl || "http://localhost:54321";
const anonKey = env.supabaseAnonKey || "public-anon-key-not-configured";

export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
