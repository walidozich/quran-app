import AsyncStorage from "@react-native-async-storage/async-storage";
import { Session } from "@supabase/supabase-js";
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../../config/supabase";
import { Profile, UserRole } from "../../types/database";
import { registerForPush, setPushActor } from "../notifications/push";

export type ProfileUpdate = { fullName: string; whatsapp: string | null; email?: string };

const LAST_PROFILE_KEY = "sahibok:last-profile"; // per-account: `${key}:${accountId}`
const MODE_KEY = "sahibok:mode"; // per-profile: `${key}:${profileId}`

type AuthValue = {
  session: Session | null;
  /** Every person-profile under the signed-in account (Netflix-style). */
  profiles: Profile[];
  /** The active person, chosen in the picker. Null until picked. */
  profile: Profile | null;
  /** Last-used profile id (highlighted in the picker). */
  lastProfileId: string | null;
  /**
   * The experience the active profile is using (Airbnb-style switch).
   * Teacher profiles toggle teaching⇄learning; others are always "student".
   */
  mode: UserRole;
  setMode: (mode: UserRole) => void;
  email: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  /** Activate a person-profile (picker tap). Remembers it as last-used. */
  activateProfile: (id: string) => Promise<void>;
  /** Back to the picker (More tab → "تبديل الفرد"). */
  deactivateProfile: () => void;
  refreshProfile: () => Promise<void>;
  updateProfile: (input: ProfileUpdate) => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [lastProfileId, setLastProfileId] = useState<string | null>(null);
  const [teacherMode, setTeacherMode] = useState<UserRole>("teacher");
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const profile = useMemo(
    () => profiles.find((p) => p.id === activeId) ?? null,
    [profiles, activeId]
  );

  // Non-teacher profiles have exactly one experience.
  const mode: UserRole = profile?.is_teacher ? teacherMode : "student";

  // The active profile is who "acts" (records, reviews, sends notifications).
  useEffect(() => {
    setPushActor(profile?.id ?? null);
  }, [profile?.id]);

  const loadProfiles = async (uid: string): Promise<Profile[]> => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("account_id", uid)
        .order("created_at", { ascending: true });
      const list = data ?? [];
      setProfiles(list);
      const last = await AsyncStorage.getItem(`${LAST_PROFILE_KEY}:${uid}`).catch(() => null);
      setLastProfileId(last && list.some((p) => p.id === last) ? last : null);
      return list;
    } catch {
      // Network/backend unreachable — don't leave the app hanging on a spinner.
      setProfiles([]);
      return [];
    }
  };

  /**
   * A cached session can outlive its account (e.g. the user was deleted
   * server-side): the JWT still verifies, profiles come back empty, and the
   * app would wrongly resume the first-profile wizard. When a session has no
   * profiles, ask the auth server whether the user still exists — if it
   * answers "no", drop the dead session so the gate lands on sign-in.
   * Network failures keep the session (could be a genuine offline mid-wizard).
   */
  const dropSessionIfDead = async (list: Profile[]): Promise<void> => {
    if (list.length > 0) return;
    const { error } = await supabase.auth.getUser();
    if (error && (error.status === 401 || error.status === 403)) {
      await supabase.auth.signOut({ scope: "local" }).catch(() => {});
      setSession(null);
      setEmail(null);
      setProfiles([]);
      setActiveId(null);
    }
  };

  useEffect(() => {
    let mounted = true;
    // Safety net: never stay stuck on the loading screen, even if the backend
    // is unreachable (e.g. the phone can't reach the Supabase port).
    const safety = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 8000);

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!mounted) return;
        setSession(data.session);
        setEmail(data.session?.user?.email ?? null);
        if (data.session) {
          const list = await loadProfiles(data.session.user.id);
          await dropSessionIfDead(list);
          registerForPush(data.session.user.id);
        }
      })
      .catch(() => {})
      .then(() => {
        if (mounted) setLoading(false);
        clearTimeout(safety);
      });

    // IMPORTANT: keep this callback synchronous and never `await` another
    // supabase call inside it — doing so holds the GoTrue lock and deadlocks
    // auth operations in React Native (a later sign-in would hang forever).
    // Defer the DB work onto a fresh tick so the lock is released first.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setEmail(s?.user?.email ?? null);
      if (!s) {
        setProfiles([]);
        setActiveId(null);
        return;
      }
      setTimeout(async () => {
        if (!mounted) return;
        const list = await loadProfiles(s.user.id);
        await dropSessionIfDead(list);
        registerForPush(s.user.id);
      }, 0);
    });

    return () => {
      mounted = false;
      clearTimeout(safety);
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      session,
      profiles,
      profile,
      lastProfileId,
      email,
      loading,
      signOut: async () => {
        // `scope: "local"` clears the on-device session without calling the
        // server's /logout endpoint — the remote call can stall while holding
        // GoTrue's internal lock, freezing every later auth operation until
        // the app restarts. Belt and braces: cap it with a timeout and clear
        // our own state no matter what.
        try {
          await withTimeout(supabase.auth.signOut({ scope: "local" }), 4000);
        } catch {
          // ignore — local state is cleared below either way
        }
        setActiveId(null);
        setProfiles([]);
        setSession(null);
        setEmail(null);
      },
      activateProfile: async (id: string) => {
        // Restore the person's last mode BEFORE entering (avoids a home flash).
        const stored = await AsyncStorage.getItem(`${MODE_KEY}:${id}`).catch(() => null);
        setTeacherMode(stored === "student" ? "student" : "teacher");
        setActiveId(id);
        setLastProfileId(id);
        const uid = session?.user?.id;
        if (uid) {
          AsyncStorage.setItem(`${LAST_PROFILE_KEY}:${uid}`, id).catch(() => {});
        }
      },
      deactivateProfile: () => setActiveId(null),
      mode,
      setMode: (m: UserRole) => {
        setTeacherMode(m);
        if (activeId) AsyncStorage.setItem(`${MODE_KEY}:${activeId}`, m).catch(() => {});
      },
      refreshProfile: async () => {
        // Read the session directly — right after sign-in the `session` state hasn't
        // been updated by onAuthStateChange yet, so relying on it would skip the
        // profile load and the index gate would bounce back to sign-in.
        const { data } = await supabase.auth.getSession();
        const user = data.session?.user;
        if (user) {
          setSession(data.session);
          setEmail(user.email ?? null);
          await loadProfiles(user.id);
        }
      },
      updateProfile: async ({ fullName, whatsapp, email: newEmail }: ProfileUpdate) => {
        if (!profile) throw new Error("not signed in");
        const { error } = await supabase
          .from("profiles")
          .update({ full_name: fullName, whatsapp })
          .eq("id", profile.id);
        if (error) throw error;
        if (newEmail && newEmail !== email) {
          const { error: e2 } = await supabase.auth.updateUser({ email: newEmail });
          if (e2) throw e2;
        }
        const { data } = await supabase.auth.getSession();
        if (data.session) await loadProfiles(data.session.user.id);
        setEmail(newEmail ?? email);
      },
    }),
    [session, profiles, profile, lastProfileId, mode, activeId, email, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// Rendered for at most one frame while logout/profile-switch tears the
// authenticated screens down. Empty ids make every query no-op harmlessly.
const TEARDOWN_PROFILE: Profile = {
  id: "",
  account_id: "",
  full_name: "",
  sex: "male",
  birth_date: "2000-01-01",
  is_teacher: false,
  avatar_color: "green",
  whatsapp: null,
  created_at: "",
};

/**
 * For screens inside authenticated route groups — profile is normally present.
 * `role` is the ACTIVE MODE: a teacher profile in learning mode reads "student",
 * so screens under (student) treat them exactly like any learner.
 * During logout/switch teardown the profile is briefly null; a release build
 * must NEVER throw for that frame (a thrown render error closes the app), so
 * a harmless placeholder is returned until the screens unmount.
 */
export function useSession(): { currentProfile: Profile; role: UserRole } {
  const { profile, mode } = useAuth();
  if (!profile) {
    if (__DEV__) console.warn("[auth] useSession rendered without a profile (teardown frame)");
    return { currentProfile: TEARDOWN_PROFILE, role: "student" };
  }
  return { currentProfile: profile, role: mode };
}

// --- auth actions ---------------------------------------------------------

/** Thrown when an auth call doesn't settle in time (network/lock stall). */
export class AuthTimeoutError extends Error {
  constructor() {
    super("auth-timeout");
    this.name = "AuthTimeoutError";
  }
}

/** Reject if the underlying promise hasn't settled in `ms` — no infinite spinners. */
function withTimeout<T>(p: PromiseLike<T>, ms = 12000): Promise<T> {
  return Promise.race([
    Promise.resolve(p),
    new Promise<T>((_, reject) => setTimeout(() => reject(new AuthTimeoutError()), ms)),
  ]);
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  const { error } = await withTimeout(supabase.auth.signInWithPassword({ email, password }));
  if (error) throw error;
}

/**
 * Create the auth account. With "Confirm email" ON, Supabase emails a 6-digit
 * code and returns no session — the caller routes to the verify screen.
 * With it OFF (dev), a session comes back immediately and verification is skipped.
 */
export async function signUpWithEmail(
  email: string,
  password: string
): Promise<{ needsVerification: boolean }> {
  const { data, error } = await withTimeout(supabase.auth.signUp({ email, password }));
  if (error) throw error;
  return { needsVerification: !data.session };
}

/** Confirm the sign-up with the 6-digit code from the email. Yields a session. */
export async function verifySignUpCode(email: string, code: string): Promise<void> {
  const { error } = await withTimeout(
    supabase.auth.verifyOtp({ type: "signup", email, token: code.trim() })
  );
  if (error) throw error;
}

/** Send a fresh sign-up confirmation code. */
export async function resendSignUpCode(email: string): Promise<void> {
  const { error } = await withTimeout(supabase.auth.resend({ type: "signup", email }));
  if (error) throw error;
}

/** Start the forgot-password flow: emails a 6-digit recovery code. */
export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await withTimeout(supabase.auth.resetPasswordForEmail(email));
  if (error) throw error;
}

/**
 * Verify the recovery code. IMPORTANT: a code is single-use — once this
 * succeeds the user IS signed in, and the same code will never verify again.
 * The screen must remember success and not re-verify on later attempts.
 */
export async function verifyRecoveryCode(email: string, code: string): Promise<void> {
  const { error } = await withTimeout(
    supabase.auth.verifyOtp({ type: "recovery", email, token: code.trim() })
  );
  if (error) throw error;
}

/** Thrown when the new password equals the current one (Supabase rejects it). */
export class SamePasswordError extends Error {
  constructor() {
    super("same-password");
    this.name = "SamePasswordError";
  }
}

/** Set a new password for the signed-in user (after verifyRecoveryCode). */
export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await withTimeout(supabase.auth.updateUser({ password: newPassword }));
  if (error) {
    if (/different from the old password/i.test(error.message)) throw new SamePasswordError();
    throw error;
  }
}
