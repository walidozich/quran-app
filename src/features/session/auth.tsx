import { Session } from "@supabase/supabase-js";
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { BYPASS_AUTH, BYPASS_ROLE, USE_LOCAL_BACKEND } from "../../config/backend";
import { supabase } from "../../config/supabase";
import { Profile, UserRole } from "../../types/database";
import { registerForPush } from "../notifications/push";
import {
  ensureDemoAccounts,
  getCurrentEmailLocal,
  getCurrentProfileLocal,
  LocalAuthError,
  signInLocal,
  signOutLocal,
  signUpLocal,
  updateProfileLocal,
} from "../local/localAuth";

export type ProfileUpdate = { fullName: string; whatsapp: string | null; email?: string };

type AuthValue = {
  session: Session | null;
  profile: Profile | null;
  email: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (input: ProfileUpdate) => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (uid: string) => {
    try {
      const { data } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
      setProfile(data ?? null);
    } catch {
      // Network/backend unreachable — don't leave the app hanging on a spinner.
      setProfile(null);
    }
  };

  useEffect(() => {
    let mounted = true;
    // Safety net: never stay stuck on the loading screen, even if the backend
    // is unreachable (e.g. the phone can't reach the Supabase port).
    const safety = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 8000);

    if (USE_LOCAL_BACKEND) {
      ensureDemoAccounts()
        .then(async () => {
          // Temporary: auto-login as a demo account, skipping the sign-in screen.
          // Remove the BYPASS_AUTH branch (or set it false) to restore real auth.
          if (BYPASS_AUTH) {
            const email = BYPASS_ROLE === "teacher" ? "teacher@quran.app" : "student@quran.app";
            try {
              await signInLocal(email, "123456");
            } catch {
              // ignore — fall back to whatever (if anything) is already signed in
            }
          }
          return Promise.all([getCurrentProfileLocal(), getCurrentEmailLocal()]);
        })
        .then(([p, mail]) => {
          if (!mounted) return;
          setProfile(p);
          setEmail(mail);
        })
        .catch(() => {})
        .then(() => {
          if (mounted) setLoading(false);
          clearTimeout(safety);
        });
      return () => {
        mounted = false;
        clearTimeout(safety);
      };
    }

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!mounted) return;
        setSession(data.session);
        setEmail(data.session?.user?.email ?? null);
        if (data.session) {
          await loadProfile(data.session.user.id);
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
        setProfile(null);
        return;
      }
      setTimeout(() => {
        if (!mounted) return;
        loadProfile(s.user.id);
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
      profile,
      email,
      loading,
      signOut: async () => {
        if (USE_LOCAL_BACKEND) {
          await signOutLocal();
          setProfile(null);
          setEmail(null);
          return;
        }
        await supabase.auth.signOut();
      },
      refreshProfile: async () => {
        if (USE_LOCAL_BACKEND) {
          const [p, mail] = await Promise.all([getCurrentProfileLocal(), getCurrentEmailLocal()]);
          setProfile(p);
          setEmail(mail);
          return;
        }
        if (session) await loadProfile(session.user.id);
      },
      updateProfile: async ({ fullName, whatsapp, email: newEmail }: ProfileUpdate) => {
        if (USE_LOCAL_BACKEND) {
          await updateProfileLocal({ fullName, whatsapp, email: newEmail });
          const [p, mail] = await Promise.all([getCurrentProfileLocal(), getCurrentEmailLocal()]);
          setProfile(p);
          setEmail(mail);
          return;
        }
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
        await loadProfile(profile.id);
        setEmail(newEmail ?? email);
      },
    }),
    [session, profile, email, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** For screens inside authenticated route groups — profile is guaranteed present. */
export function useSession(): { currentProfile: Profile; role: UserRole } {
  const { profile } = useAuth();
  if (!profile) throw new Error("useSession requires an authenticated profile");
  return { currentProfile: profile, role: profile.role };
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
  if (USE_LOCAL_BACKEND) {
    await signInLocal(email, password);
    return;
  }
  const { error } = await withTimeout(supabase.auth.signInWithPassword({ email, password }));
  if (error) throw error;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string,
  role: UserRole
): Promise<void> {
  if (USE_LOCAL_BACKEND) {
    await signUpLocal(email, password, fullName, role);
    return;
  }
  const { data, error } = await withTimeout(supabase.auth.signUp({ email, password }));
  if (error) throw error;
  if (data.user) {
    const { error: pErr } = await supabase
      .from("profiles")
      .insert({ id: data.user.id, full_name: fullName, role });
    if (pErr) throw pErr;
  }
}

export { LocalAuthError };
