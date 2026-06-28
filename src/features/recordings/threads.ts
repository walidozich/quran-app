import { RecordingStatus } from "../../types/database";

export type ThreadLike = {
  id: string;
  label: string;
  responds_to_id: string | null;
  status: RecordingStatus;
  created_at: string;
};

export type Thread<T extends ThreadLike> = {
  rootId: string;
  label: string;
  attempts: T[]; // oldest → newest
  latest: T;
};

/**
 * Group a flat list of recordings into attempt threads by walking `responds_to_id`
 * up to the root (the recording with no parent). Attempts are ordered oldest→newest;
 * threads are ordered by most-recent activity.
 */
export function buildThreads<T extends ThreadLike>(recordings: T[]): Thread<T>[] {
  const byId = new Map(recordings.map((r) => [r.id, r]));

  const rootOf = (rec: T): T => {
    let cur = rec;
    const seen = new Set<string>();
    while (cur.responds_to_id && byId.has(cur.responds_to_id) && !seen.has(cur.id)) {
      seen.add(cur.id);
      cur = byId.get(cur.responds_to_id) as T;
    }
    return cur;
  };

  const groups = new Map<string, T[]>();
  for (const rec of recordings) {
    const rootId = rootOf(rec).id;
    const arr = groups.get(rootId) ?? [];
    arr.push(rec);
    groups.set(rootId, arr);
  }

  const threads: Thread<T>[] = [];
  for (const [rootId, arr] of groups) {
    arr.sort((a, b) => a.created_at.localeCompare(b.created_at));
    const root = byId.get(rootId) as T;
    threads.push({ rootId, label: root.label, attempts: arr, latest: arr[arr.length - 1] });
  }
  threads.sort((a, b) => b.latest.created_at.localeCompare(a.latest.created_at));
  return threads;
}
