import AsyncStorage from "@react-native-async-storage/async-storage";
import { Profile, UserRole } from "../../types/database";
import { getDb, mutate, nowIso, uid } from "./store";

// Local accounts live alongside the on-device DB. Passwords are stored in plain
// text — acceptable ONLY because this is a local-only prototype with no network.
type LocalAccount = { email: string; password: string; profileId: string };

const ACCOUNTS_KEY = "qln_local_accounts_v1";
const CURRENT_KEY = "qln_local_current_v1";

async function readAccounts(): Promise<LocalAccount[]> {
  const raw = await AsyncStorage.getItem(ACCOUNTS_KEY);
  return raw ? (JSON.parse(raw) as LocalAccount[]) : [];
}

async function writeAccounts(accounts: LocalAccount[]): Promise<void> {
  await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export class LocalAuthError extends Error {}

// Demo accounts seeded on first run so there are ready credentials to log in with.
const DEMO_ACCOUNTS: { email: string; password: string; fullName: string; role: UserRole }[] = [
  { email: "teacher@quran.app", password: "123456", fullName: "الأستاذ أحمد", role: "teacher" },
  { email: "student@quran.app", password: "123456", fullName: "الطالب يوسف", role: "student" },
];

/** Create the demo teacher/student accounts once (only if no accounts exist yet). */
export async function ensureDemoAccounts(): Promise<void> {
  const accounts = await readAccounts();
  if (accounts.length > 0) return;
  const seeded: LocalAccount[] = [];
  for (const d of DEMO_ACCOUNTS) {
    const profile: Profile = { id: uid(), full_name: d.fullName, role: d.role, created_at: nowIso() };
    await mutate((db) => db.profiles.push(profile));
    seeded.push({ email: d.email, password: d.password, profileId: profile.id });
  }
  await writeAccounts(seeded);
}

export async function signUpLocal(
  email: string,
  password: string,
  fullName: string,
  role: UserRole
): Promise<Profile> {
  const normEmail = email.trim().toLowerCase();
  const accounts = await readAccounts();
  if (accounts.some((a) => a.email === normEmail)) {
    throw new LocalAuthError("email_taken");
  }
  const profile: Profile = {
    id: uid(),
    full_name: fullName,
    role,
    created_at: nowIso(),
  };
  await mutate((db) => db.profiles.push(profile));
  accounts.push({ email: normEmail, password, profileId: profile.id });
  await writeAccounts(accounts);
  await AsyncStorage.setItem(CURRENT_KEY, profile.id);
  return profile;
}

export async function signInLocal(email: string, password: string): Promise<Profile> {
  const normEmail = email.trim().toLowerCase();
  const accounts = await readAccounts();
  const account = accounts.find((a) => a.email === normEmail && a.password === password);
  if (!account) throw new LocalAuthError("invalid_credentials");
  await AsyncStorage.setItem(CURRENT_KEY, account.profileId);
  const profile = await getCurrentProfileLocal();
  if (!profile) throw new LocalAuthError("profile_missing");
  return profile;
}

export async function signOutLocal(): Promise<void> {
  await AsyncStorage.removeItem(CURRENT_KEY);
}

export async function getCurrentProfileLocal(): Promise<Profile | null> {
  const id = await AsyncStorage.getItem(CURRENT_KEY);
  if (!id) return null;
  const db = await getDb();
  return db.profiles.find((p) => p.id === id) ?? null;
}
