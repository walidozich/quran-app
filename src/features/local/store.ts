import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Annotation,
  AnnotationTag,
  ClassMember,
  ClassRow,
  Profile,
  Recording,
  Tag,
} from "../../types/database";

export type LocalDB = {
  profiles: Profile[];
  classes: ClassRow[];
  class_members: ClassMember[];
  recordings: Recording[];
  annotations: Annotation[];
  tags: Tag[];
  annotation_tags: AnnotationTag[];
};

const DB_KEY = "qln_local_db_v1";

const SEED_TAGS: { name: string; color: string }[] = [
  { name: "مدّ", color: "#0E5E4E" },
  { name: "غُنّة", color: "#1B7A63" },
  { name: "قلقلة", color: "#C9A227" },
  { name: "إدغام", color: "#8A6D1F" },
  { name: "إخفاء", color: "#2E7D5B" },
  { name: "إظهار", color: "#5B7B8A" },
  { name: "مخرج الحرف", color: "#B4413C" },
  { name: "كلمة ناقصة", color: "#9C5A3C" },
  { name: "كلمة زائدة", color: "#7A5C9C" },
  { name: "وقف وابتداء", color: "#3C7A9C" },
  { name: "تشكيل", color: "#6B7280" },
];

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

export function nowIso(): string {
  return new Date().toISOString();
}

function seed(): LocalDB {
  return {
    profiles: [],
    classes: [],
    class_members: [],
    recordings: [],
    annotations: [],
    tags: SEED_TAGS.map((t) => ({
      id: uid(),
      name: t.name,
      color: t.color,
      is_seeded: true,
      created_by: null,
      created_at: nowIso(),
    })),
    annotation_tags: [],
  };
}

let cache: LocalDB | null = null;

async function load(): Promise<LocalDB> {
  if (cache) return cache;
  const raw = await AsyncStorage.getItem(DB_KEY);
  if (raw) {
    cache = JSON.parse(raw) as LocalDB;
  } else {
    cache = seed();
    await AsyncStorage.setItem(DB_KEY, JSON.stringify(cache));
  }
  return cache;
}

export async function getDb(): Promise<LocalDB> {
  return load();
}

/** Read-mutate-persist helper. The callback returns a value forwarded to the caller. */
export async function mutate<R>(fn: (db: LocalDB) => R): Promise<R> {
  const db = await load();
  const result = fn(db);
  await AsyncStorage.setItem(DB_KEY, JSON.stringify(db));
  return result;
}
