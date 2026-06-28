import { RecordingStatus, Tag } from "../../types/database";

export type TagCount = { id: string; name: string; color: string; count: number };

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
