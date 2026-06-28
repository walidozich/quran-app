// Backend selector. When true, the app runs fully on-device (AsyncStorage data,
// local auth, local file storage) and does NOT talk to Supabase. Flip to false to
// use the Supabase backend (requires .env + migrations). The Supabase code paths
// are kept intact behind this flag.
// false → use the Supabase backend (shared server: data, auth, audio storage).
// This is required for the two-phone teacher/student simulation, since each phone
// must see the same server state. Set the URL + anon key in .env.
export const USE_LOCAL_BACKEND = false;

// --- Temporary auth bypass ------------------------------------------------
// Skips the real sign-in / sign-up screens and drops straight into the app as a
// seeded demo account. Kept for quick single-device testing; OFF for the
// multi-user server setup so each phone logs in as a distinct account.
// Flip BYPASS_ROLE to enter as the other side of the loop.
export const BYPASS_AUTH = false;
export const BYPASS_ROLE: "teacher" | "student" = "teacher";
