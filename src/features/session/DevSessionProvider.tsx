import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { Profile, UserRole } from "../../types/database";

// Dev-only profiles — UUIDs match the seed rows in 0001_init.sql.
// Phase 9 replaces this whole module with a real Supabase Auth session.
export const DEV_PROFILES: Record<UserRole, Profile> = {
  teacher: {
    id: "11111111-1111-1111-1111-111111111111",
    full_name: "الأستاذ أحمد",
    role: "teacher",
    created_at: new Date(0).toISOString(),
  },
  student: {
    id: "22222222-2222-2222-2222-222222222222",
    full_name: "الطالب يوسف",
    role: "student",
    created_at: new Date(0).toISOString(),
  },
};

type SessionContextValue = {
  currentProfile: Profile;
  role: UserRole;
  switchRole: (role: UserRole) => void;
  isDev: true;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function DevSessionProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>("student");

  const value = useMemo<SessionContextValue>(
    () => ({
      currentProfile: DEV_PROFILES[role],
      role,
      switchRole: setRole,
      isDev: true,
    }),
    [role]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within DevSessionProvider");
  return ctx;
}
