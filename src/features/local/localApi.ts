import {
  Annotation,
  ClassRow,
  Recording,
  RecordingStatus,
  Tag,
} from "../../types/database";
import type { ClassMemberWithProfile, ClassWithTeacher } from "../classes/api";
import { genJoinCode, JoinClassError } from "../classes/joinCode";
import type { AnnotationWithTags } from "../annotations/api";
import type { RecordingWithStudent } from "../recordings/api";
import type { StudyAnnotation } from "../tags/studyByTag";
import { getDb, mutate, nowIso, uid } from "./store";

// ---- helpers --------------------------------------------------------------
async function tagsForAnnotation(annotationId: string): Promise<Tag[]> {
  const db = await getDb();
  const tagIds = db.annotation_tags.filter((at) => at.annotation_id === annotationId).map((at) => at.tag_id);
  return db.tags.filter((tg) => tagIds.includes(tg.id));
}

// ---- classes --------------------------------------------------------------
export async function localFetchTeacherClasses(teacherId: string): Promise<ClassRow[]> {
  const db = await getDb();
  return db.classes
    .filter((c) => c.teacher_id === teacherId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function localFetchClassMembers(classId: string): Promise<ClassMemberWithProfile[]> {
  const db = await getDb();
  return db.class_members
    .filter((m) => m.class_id === classId)
    .sort((a, b) => a.joined_at.localeCompare(b.joined_at))
    .map((m) => {
      const p = db.profiles.find((x) => x.id === m.student_id);
      return { id: m.id, joined_at: m.joined_at, student: { id: m.student_id, full_name: p?.full_name ?? "" } };
    });
}

export async function localFetchStudentClasses(studentId: string): Promise<ClassWithTeacher[]> {
  const db = await getDb();
  return db.class_members
    .filter((m) => m.student_id === studentId)
    .sort((a, b) => b.joined_at.localeCompare(a.joined_at))
    .map((m) => db.classes.find((c) => c.id === m.class_id))
    .filter((c): c is ClassRow => Boolean(c))
    .map((c) => ({
      ...c,
      teacher: db.profiles.find((p) => p.id === c.teacher_id) ?? null,
    }));
}

export async function localCreateClass(teacherId: string, name: string): Promise<ClassRow> {
  const cls: ClassRow = {
    id: uid(),
    teacher_id: teacherId,
    name,
    join_code: genJoinCode(),
    created_at: nowIso(),
  };
  await mutate((db) => db.classes.push(cls));
  return cls;
}

export async function localJoinClass(studentId: string, rawCode: string): Promise<ClassRow> {
  const code = rawCode.trim().toUpperCase();
  const db = await getDb();
  const cls = db.classes.find((c) => c.join_code === code);
  if (!cls) throw new JoinClassError("not_found");
  await mutate((d) => {
    const exists = d.class_members.some((m) => m.class_id === cls.id && m.student_id === studentId);
    if (!exists) {
      d.class_members.push({ id: uid(), class_id: cls.id, student_id: studentId, joined_at: nowIso() });
    }
  });
  return cls;
}

// ---- recordings -----------------------------------------------------------
export async function localFetchStudentRecordings(studentId: string): Promise<Recording[]> {
  const db = await getDb();
  return db.recordings
    .filter((r) => r.student_id === studentId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function localFetchRecordingById(id: string): Promise<Recording | null> {
  const db = await getDb();
  return db.recordings.find((r) => r.id === id) ?? null;
}

export async function localFetchTeacherRecordings(teacherId: string): Promise<RecordingWithStudent[]> {
  const db = await getDb();
  const classIds = db.classes.filter((c) => c.teacher_id === teacherId).map((c) => c.id);
  return db.recordings
    .filter((r) => classIds.includes(r.class_id))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((r) => {
      const p = db.profiles.find((x) => x.id === r.student_id);
      return { ...r, student: { full_name: p?.full_name ?? "" } };
    });
}

export async function localSetRecordingStatus(
  id: string,
  status: RecordingStatus,
  reviewedAt?: string | null
): Promise<void> {
  await mutate((db) => {
    const rec = db.recordings.find((r) => r.id === id);
    if (rec) {
      rec.status = status;
      if (reviewedAt !== undefined) rec.reviewed_at = reviewedAt;
    }
  });
}

export async function localInsertRecording(input: {
  classId: string;
  studentId: string;
  label: string;
  audioPath: string;
  durationMs: number;
  respondsToId: string | null;
}): Promise<Recording> {
  const rec: Recording = {
    id: uid(),
    class_id: input.classId,
    student_id: input.studentId,
    label: input.label,
    audio_path: input.audioPath,
    duration_ms: Math.round(input.durationMs),
    responds_to_id: input.respondsToId,
    status: "pending",
    reviewed_at: null,
    created_at: nowIso(),
  };
  await mutate((db) => db.recordings.push(rec));
  return rec;
}

// ---- annotations ----------------------------------------------------------
export async function localFetchAnnotations(recordingId: string): Promise<AnnotationWithTags[]> {
  const db = await getDb();
  const anns = db.annotations
    .filter((a) => a.recording_id === recordingId)
    .sort((a, b) => a.timestamp_ms - b.timestamp_ms);
  return Promise.all(anns.map(async (a) => ({ ...a, tags: await tagsForAnnotation(a.id) })));
}

async function localSetAnnotationTags(annotationId: string, tagIds: string[]): Promise<void> {
  await mutate((db) => {
    db.annotation_tags = db.annotation_tags.filter((at) => at.annotation_id !== annotationId);
    tagIds.forEach((tag_id) => db.annotation_tags.push({ annotation_id: annotationId, tag_id }));
  });
}

export async function localInsertAnnotation(input: {
  recordingId: string;
  teacherId: string;
  timestampMs: number;
  commentText: string | null;
  voicePath: string | null;
  voiceDurationMs: number | null;
  tagIds: string[];
}): Promise<string> {
  const ann: Annotation = {
    id: uid(),
    recording_id: input.recordingId,
    teacher_id: input.teacherId,
    timestamp_ms: Math.round(input.timestampMs),
    comment_text: input.commentText,
    voice_path: input.voicePath,
    voice_duration_ms: input.voiceDurationMs,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  await mutate((db) => db.annotations.push(ann));
  await localSetAnnotationTags(ann.id, input.tagIds);
  return ann.id;
}

export async function localUpdateAnnotation(
  id: string,
  commentText: string | null,
  tagIds: string[]
): Promise<void> {
  await mutate((db) => {
    const ann = db.annotations.find((a) => a.id === id);
    if (ann) {
      ann.comment_text = commentText;
      ann.updated_at = nowIso();
    }
  });
  await localSetAnnotationTags(id, tagIds);
}

export async function localDeleteAnnotation(id: string): Promise<void> {
  await mutate((db) => {
    db.annotations = db.annotations.filter((a) => a.id !== id);
    db.annotation_tags = db.annotation_tags.filter((at) => at.annotation_id !== id);
  });
}

// ---- tags -----------------------------------------------------------------
export async function localFetchTags(): Promise<Tag[]> {
  const db = await getDb();
  return [...db.tags].sort((a, b) => {
    if (a.is_seeded !== b.is_seeded) return a.is_seeded ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export async function localCreateTag(name: string, createdBy: string): Promise<Tag> {
  const trimmed = name.trim();
  const db = await getDb();
  const existing = db.tags.find((t) => t.name === trimmed);
  if (existing) return existing;
  const tag: Tag = {
    id: uid(),
    name: trimmed,
    color: "#0E5E4E",
    is_seeded: false,
    created_by: createdBy,
    created_at: nowIso(),
  };
  await mutate((d) => d.tags.push(tag));
  return tag;
}

// ---- study by tag ---------------------------------------------------------
export async function localFetchStudentAnnotations(studentId: string): Promise<StudyAnnotation[]> {
  const db = await getDb();
  const reviewed = db.recordings.filter((r) => r.student_id === studentId && r.status === "reviewed");
  const byId = new Map(reviewed.map((r) => [r.id, r]));
  const anns = db.annotations
    .filter((a) => byId.has(a.recording_id))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  return Promise.all(
    anns.map(async (a) => {
      const rec = byId.get(a.recording_id) as Recording;
      return { ...a, tags: await tagsForAnnotation(a.id), recording: { id: rec.id, label: rec.label } };
    })
  );
}
