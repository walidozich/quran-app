import { ayahRangeLabel, pageRangeLabel, SURAHS } from "../../data/surahs";
import { t } from "../../i18n/ar";
import { RecordingReference, Wird } from "../../types/database";

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

/** Route to the record screen, pre-filled and linked to this wird. */
export function recordWirdUrl(w: Wird, respondsTo?: string | null): string {
  const params = new URLSearchParams({ classId: w.class_id, label: wirdRefLabel(w), wird_id: w.id });
  if (respondsTo) params.set("respondsTo", respondsTo);
  if (w.ref_type) {
    params.set("ref_type", w.ref_type);
    for (const k of ["surah_start", "ayah_start", "surah_end", "ayah_end", "page_start", "page_end"] as const) {
      const v = w[k];
      if (v != null) params.set(k, String(v));
    }
  }
  return `/(student)/record?${params.toString()}`;
}

// --- next-wird suggestion ----------------------------------------------------
// Global (linear) ayah indexing over the 114 surahs, so a range can continue
// across surah boundaries: البقرة ٢٨٥-٢٨٦ (length 2) → آل عمران ١-٢.

const CUMULATIVE: number[] = (() => {
  const acc: number[] = [0];
  for (const s of SURAHS) acc.push(acc[acc.length - 1] + s.ayahs);
  return acc; // CUMULATIVE[i] = ayahs before surah number i+1
})();
const TOTAL_AYAHS = CUMULATIVE[CUMULATIVE.length - 1];

function toGlobal(surah: number, ayah: number): number {
  return CUMULATIVE[surah - 1] + ayah; // 1-based
}

function fromGlobal(g: number): { surah: number; ayah: number } {
  let surah = 1;
  while (surah < 114 && CUMULATIVE[surah] < g) surah += 1;
  return { surah, ayah: g - CUMULATIVE[surah - 1] };
}

/**
 * The portion that continues right after a finished wird, with the same length
 * (البقرة ١-٥ → البقرة ٦-١٠). Null when the wird has no structured reference or
 * the Quran/mushaf ends.
 */
export function nextWirdRef(w: Wird): (RecordingReference & { label: string }) | null {
  if (w.ref_type === "ayah" && w.surah_start && w.ayah_start) {
    const surahEnd = w.surah_end ?? w.surah_start;
    const ayahEnd = w.ayah_end ?? w.ayah_start;
    const gStart = toGlobal(w.surah_start, w.ayah_start);
    const gEnd = toGlobal(surahEnd, ayahEnd);
    const len = gEnd - gStart + 1;
    if (gEnd >= TOTAL_AYAHS) return null;
    const nStart = gEnd + 1;
    const nEnd = Math.min(nStart + len - 1, TOTAL_AYAHS);
    const s = fromGlobal(nStart);
    const e = fromGlobal(nEnd);
    const ref: RecordingReference = {
      ref_type: "ayah",
      surah_start: s.surah,
      ayah_start: s.ayah,
      surah_end: e.surah,
      ayah_end: e.ayah,
      page_start: null,
      page_end: null,
    };
    return { ...ref, label: wirdRefLabel({ ...ref, title: null }) };
  }
  if (w.ref_type === "page" && w.page_start) {
    const end = w.page_end ?? w.page_start;
    const len = end - w.page_start + 1;
    if (end >= 604) return null;
    const nStart = end + 1;
    const nEnd = Math.min(nStart + len - 1, 604);
    const ref: RecordingReference = {
      ref_type: "page",
      surah_start: null,
      ayah_start: null,
      surah_end: null,
      ayah_end: null,
      page_start: nStart,
      page_end: nEnd,
    };
    return { ...ref, label: wirdRefLabel({ ...ref, title: null }) };
  }
  return null;
}
