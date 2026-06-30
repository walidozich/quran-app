import { ayahRangeLabel, pageRangeLabel, SURAHS } from "../../data/surahs";
import { t } from "../../i18n/ar";
import { Wird } from "../../types/database";

/** Reconstruct a display label for a stored wird from its structured ref columns. */
export function wirdRefLabel(w: Pick<Wird,
  "ref_type" | "surah_start" | "ayah_start" | "surah_end" | "ayah_end" | "page_start" | "page_end" | "title"
>): string {
  if (w.ref_type === "page" && w.page_start) {
    return pageRangeLabel(w.page_start, w.page_end ?? null);
  }
  if (w.ref_type === "ayah" && w.surah_start && w.ayah_start) {
    const start = SURAHS.find((s) => s.number === w.surah_start);
    const end = w.surah_end ? SURAHS.find((s) => s.number === w.surah_end) : start;
    if (start) return ayahRangeLabel(start, w.ayah_start, end, w.ayah_end ?? null);
  }
  return w.title?.trim() || t("wird.untitled");
}

/** True when the wird has a due date in the past. */
export function isOverdue(dueAt: string | null): boolean {
  return Boolean(dueAt) && new Date(dueAt as string).getTime() < Date.now();
}

export type WirdStatus = "new" | "submitted" | "reviewed" | "done";

/**
 * Derive a student's status for a wird: done (teacher-marked) > reviewed >
 * submitted (has a linked recording) > new. `recordings` should already be the
 * student's recordings; only those linked to this wird are considered.
 */
export function wirdStatusFor(
  wirdId: string,
  recordings: { wird_id?: string | null; status: string; created_at: string }[],
  isComplete: boolean
): WirdStatus {
  if (isComplete) return "done";
  const linked = recordings.filter((r) => r.wird_id === wirdId);
  if (linked.length === 0) return "new";
  const latest = linked.reduce((a, b) => (a.created_at >= b.created_at ? a : b));
  return latest.status === "reviewed" ? "reviewed" : "submitted";
}
