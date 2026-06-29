import { QURAN_PAGES, SURAHS } from "../../data/surahs";
import type { Recording, RecordingStatus, Tag } from "../../types/database";

export type TagCount = { id: string; name: string; color: string; count: number };
export type MetricCount = { id: string; name: string; count: number; color?: string };

/** Count how often each tag appears across a set of annotations, most-frequent first. */
export function tagFrequency(annotations: { tags: Tag[] }[]): TagCount[] {
  const map = new Map<string, TagCount>();
  for (const a of annotations) {
    for (const tag of a.tags) {
      const cur = map.get(tag.id);
      if (cur) cur.count += 1;
      else map.set(tag.id, { id: tag.id, name: tag.name, color: tag.color, count: 1 });
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

export type StatusCounts = {
  pending: number;
  inReview: number;
  reviewed: number;
  total: number;
};

export function statusCounts(recordings: { status: RecordingStatus }[]): StatusCounts {
  const c: StatusCounts = { pending: 0, inReview: 0, reviewed: 0, total: recordings.length };
  for (const r of recordings) {
    if (r.status === "reviewed") c.reviewed += 1;
    else if (r.status === "in_review") c.inReview += 1;
    else c.pending += 1;
  }
  return c;
}

const TOTAL_AYAHS = SURAHS.reduce((sum, s) => sum + s.ayahs, 0);
const surahByNumber = new Map(SURAHS.map((s) => [s.number, s]));

function ayahKey(surah: number, ayah: number): string {
  return `${surah}:${ayah}`;
}

function ayahRefs(recordings: Recording[]): Recording[] {
  return recordings.filter(
    (r) =>
      r.ref_type === "ayah" &&
      r.surah_start != null &&
      r.ayah_start != null &&
      r.surah_end != null &&
      r.ayah_end != null
  );
}

function pageRefs(recordings: Recording[]): Recording[] {
  return recordings.filter((r) => r.ref_type === "page" && r.page_start != null && r.page_end != null);
}

export type CoverageStats = {
  ayahsCovered: number;
  ayahPercent: number;
  pagesCovered: number;
  pagePercent: number;
};

export function coverageStats(recordings: Recording[]): CoverageStats {
  const ayahs = new Set<string>();
  for (const r of ayahRefs(recordings)) {
    const startSurah = r.surah_start as number;
    const endSurah = r.surah_end as number;
    for (let surahNo = startSurah; surahNo <= endSurah; surahNo += 1) {
      const surah = surahByNumber.get(surahNo);
      if (!surah) continue;
      const from = surahNo === startSurah ? (r.ayah_start as number) : 1;
      const to = surahNo === endSurah ? (r.ayah_end as number) : surah.ayahs;
      for (let ayah = from; ayah <= Math.min(to, surah.ayahs); ayah += 1) {
        ayahs.add(ayahKey(surahNo, ayah));
      }
    }
  }

  const pages = new Set<number>();
  for (const r of pageRefs(recordings)) {
    for (let page = r.page_start as number; page <= (r.page_end as number); page += 1) {
      if (page >= 1 && page <= QURAN_PAGES) pages.add(page);
    }
  }

  return {
    ayahsCovered: ayahs.size,
    ayahPercent: Math.round((ayahs.size / TOTAL_AYAHS) * 100),
    pagesCovered: pages.size,
    pagePercent: Math.round((pages.size / QURAN_PAGES) * 100),
  };
}

function surahsForRecording(recording: Recording): number[] {
  if (
    recording.ref_type !== "ayah" ||
    recording.surah_start == null ||
    recording.surah_end == null ||
    recording.surah_end < recording.surah_start
  ) {
    return [];
  }
  const out: number[] = [];
  for (let n = recording.surah_start; n <= recording.surah_end; n += 1) out.push(n);
  return out;
}

function sortedSurahCounts(map: Map<number, number>): MetricCount[] {
  return [...map.entries()]
    .map(([surahNo, count]) => ({
      id: String(surahNo),
      name: surahByNumber.get(surahNo)?.name ?? String(surahNo),
      count,
    }))
    .sort((a, b) => b.count - a.count || Number(a.id) - Number(b.id));
}

export function mostRecitedSurahs(recordings: Recording[]): MetricCount[] {
  const map = new Map<number, number>();
  for (const r of recordings) {
    for (const surahNo of surahsForRecording(r)) {
      map.set(surahNo, (map.get(surahNo) ?? 0) + 1);
    }
  }
  return sortedSurahCounts(map);
}

export function surahStruggleMap(
  annotations: { recording_id: string }[],
  recordings: Recording[]
): MetricCount[] {
  const recordingsById = new Map(recordings.map((r) => [r.id, r]));
  const map = new Map<number, number>();
  for (const annotation of annotations) {
    const recording = recordingsById.get(annotation.recording_id);
    if (!recording) continue;
    for (const surahNo of surahsForRecording(recording)) {
      map.set(surahNo, (map.get(surahNo) ?? 0) + 1);
    }
  }
  return sortedSurahCounts(map);
}
