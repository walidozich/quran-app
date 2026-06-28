// Backend selector. When true, the app runs fully on-device (AsyncStorage data,
// local auth, local file storage) and does NOT talk to Supabase. Flip to false to
// use the Supabase backend (requires .env + migrations). The Supabase code paths
// are kept intact behind this flag.
export const USE_LOCAL_BACKEND = true;

// --- Temporary auth bypass ------------------------------------------------
// Skips the real sign-in / sign-up screens and drops straight into the app as a
// seeded demo account. The real auth code is left intact; set BYPASS_AUTH = false
// to restore the login gate (we'll get the real auth back later).
// Flip BYPASS_ROLE to enter as the other side of the loop.
export const BYPASS_AUTH = true;
export const BYPASS_ROLE: "teacher" | "student" = "teacher";
