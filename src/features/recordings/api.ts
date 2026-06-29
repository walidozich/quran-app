import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { USE_LOCAL_BACKEND } from "../../config/backend";
import { supabase } from "../../config/supabase";
import { t } from "../../i18n/ar";
import { uploadAudio } from "../../lib/audio";
import { Recording, RecordingReference, RecordingStatus } from "../../types/database";
import {
  localFetchRecordingById,
  localFetchStudentRecordings,
  localFetchTeacherRecordings,
  localInsertRecording,
  localSetRecordingStatus,
} from "../local/localApi";
import { sendPushToProfile } from "../notifications/push";

export type RecordingWithStudent = Recording & { student: { full_name: string } };

export const recordingKeys = {
  student: (studentId: string) => ["recordings", "student", studentId] as const,
  teacher: (teacherId: string) => ["recordings", "teacher", teacherId] as const,
  detail: (id: string) => ["recordings", "detail", id] as const,
  signedUrl: (path: string) => ["recordings", "signed", path] as const,
};

async function fetchStudentRecordings(studentId: string): Promise<Recording[]> {
  if (USE_LOCAL_BACKEND) return localFetchStudentRecordings(studentId);
  const { data, error } = await supabase
    .from("recordings")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export function useStudentRecordings(studentId: string) {
  return useQuery({
    queryKey: recordingKeys.student(studentId),
    queryFn: () => fetchStudentRecordings(studentId),
  });
}

async function fetchRecordingById(id: string): Promise<Recording | null> {
  if (USE_LOCAL_BACKEND) return localFetchRecordingById(id);
  const { data, error } = await supabase.from("recordings").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export function useRecording(id: string) {
  return useQuery({
    queryKey: recordingKeys.detail(id),
    queryFn: () => fetchRecordingById(id),
  });
}

async function fetchTeacherRecordings(teacherId: string): Promise<RecordingWithStudent[]> {
  if (USE_LOCAL_BACKEND) return localFetchTeacherRecordings(teacherId);
  const { data: classes, error: clsErr } = await supabase
    .from("classes")
    .select("id")
    .eq("teacher_id", teacherId);
  if (clsErr) throw clsErr;
  const ids = (classes ?? []).map((c) => c.id);
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from("recordings")
    .select("*, student:profiles(full_name)")
    .in("class_id", ids)
    .order("created_at", { ascending: false })
    .returns<RecordingWithStudent[]>();
  if (error) throw error;
  return data ?? [];
}

export function useTeacherRecordings(teacherId: string) {
  return useQuery({
    queryKey: recordingKeys.teacher(teacherId),
    queryFn: () => fetchTeacherRecordings(teacherId),
  });
}

async function fetchSignedAudioUrl(path: string): Promise<string> {
  // Local backend stores a file:// uri directly as the path.
  if (USE_LOCAL_BACKEND) return path;
  const { data, error } = await supabase.storage.from("recordings").createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}

export function useSignedAudioUrl(path: string | undefined) {
  return useQuery({
    queryKey: recordingKeys.signedUrl(path ?? "none"),
    queryFn: () => fetchSignedAudioUrl(path as string),
    enabled: Boolean(path),
    staleTime: 50 * 60 * 1000,
  });
}

/** Set a recording's status (e.g. pending → in_review on first annotation). */
export function useSetRecordingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      reviewedAt,
    }: {
      id: string;
      status: RecordingStatus;
      reviewedAt?: string | null;
      // Optional context for a richer notification (not persisted).
      teacherName?: string;
      label?: string;
    }): Promise<void> => {
      if (USE_LOCAL_BACKEND) return localSetRecordingStatus(id, status, reviewedAt);
      const patch: { status: RecordingStatus; reviewed_at?: string | null } = { status };
      if (reviewedAt !== undefined) patch.reviewed_at = reviewedAt;
      const { error } = await supabase.from("recordings").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: async (_data, vars) => {
      qc.invalidateQueries({ queryKey: recordingKeys.detail(vars.id) });
      qc.invalidateQueries({ queryKey: ["recordings"] });
      // Notify the student when their recording is published as reviewed.
      if (!USE_LOCAL_BACKEND && vars.status === "reviewed") {
        const { data: rec } = await supabase
          .from("recordings")
          .select("student_id")
          .eq("id", vars.id)
          .maybeSingle();
        if (rec?.student_id) {
          const body = vars.teacherName
            ? `${vars.teacherName}${vars.label ? ` — ${vars.label}` : ""}`
            : t("notif.reviewedBody");
          sendPushToProfile(rec.student_id, t("notif.reviewedTitle"), body, {
            recordingId: vars.id,
          });
        }
      }
    },
  });
}

export type NewRecordingInput = {
  classId: string;
  label: string;
  localUri: string;
  durationMs: number;
  respondsToId?: string | null;
  /** Sender's display name, for a richer notification (not persisted). */
  studentName?: string;
} & Partial<RecordingReference>;

export function useCreateRecording(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewRecordingInput): Promise<Recording> => {
      const path = `${studentId}/${Date.now()}.m4a`;
      const storedPath = await uploadAudio(input.localUri, "recordings", path);

      if (USE_LOCAL_BACKEND) {
        return localInsertRecording({
          classId: input.classId,
          studentId,
          label: input.label,
          audioPath: storedPath,
          durationMs: input.durationMs,
          respondsToId: input.respondsToId ?? null,
          refType: input.ref_type ?? null,
          surahStart: input.surah_start ?? null,
          ayahStart: input.ayah_start ?? null,
          surahEnd: input.surah_end ?? null,
          ayahEnd: input.ayah_end ?? null,
          pageStart: input.page_start ?? null,
          pageEnd: input.page_end ?? null,
        });
      }

      const { data, error } = await supabase
        .from("recordings")
        .insert({
          class_id: input.classId,
          student_id: studentId,
          label: input.label,
          audio_path: storedPath,
          duration_ms: Math.round(input.durationMs),
          responds_to_id: input.respondsToId ?? null,
          status: "pending",
          ref_type: input.ref_type ?? null,
          surah_start: input.surah_start ?? null,
          ayah_start: input.ayah_start ?? null,
          surah_end: input.surah_end ?? null,
          ayah_end: input.ayah_end ?? null,
          page_start: input.page_start ?? null,
          page_end: input.page_end ?? null,
        })
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: async (data, vars) => {
      qc.invalidateQueries({ queryKey: recordingKeys.student(studentId) });
      // Notify the class teacher that a new recording arrived.
      if (!USE_LOCAL_BACKEND && data?.class_id) {
        const { data: cls } = await supabase
          .from("classes")
          .select("teacher_id")
          .eq("id", data.class_id)
          .maybeSingle();
        if (cls?.teacher_id) {
          const body = vars.studentName
            ? `${vars.studentName}${vars.label ? ` — ${vars.label}` : ""}`
            : t("notif.newRecordingBody");
          sendPushToProfile(cls.teacher_id, t("notif.newRecordingTitle"), body, {
            recordingId: data.id,
          });
        }
      }
    },
  });
}
