import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../config/supabase";
import { t } from "../../i18n/ar";
import { uploadAudio } from "../../lib/audio";
import { Recording, RecordingReference, RecordingStatus } from "../../types/database";
import { fetchTeachingClassIds } from "../classes/api";
import { sendPushToProfile } from "../notifications/push";

export type RecordingWithStudent = Recording & { student: { full_name: string } };

export const recordingKeys = {
  student: (studentId: string) => ["recordings", "student", studentId] as const,
  teacher: (teacherId: string) => ["recordings", "teacher", teacherId] as const,
  detail: (id: string) => ["recordings", "detail", id] as const,
  signedUrl: (path: string) => ["recordings", "signed", path] as const,
};

async function fetchStudentRecordings(studentId: string): Promise<Recording[]> {
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

export type RecordingWithReviewer = Recording & { reviewer: { full_name: string } | null };

async function fetchRecordingById(id: string): Promise<RecordingWithReviewer | null> {
  const { data, error } = await supabase
    .from("recordings")
    .select("*, reviewer:profiles!recordings_reviewed_by_fkey(full_name)")
    .eq("id", id)
    .maybeSingle<RecordingWithReviewer>();
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
  // Owned AND co-taught classes (v2 P6).
  const ids = await fetchTeachingClassIds(teacherId);
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from("recordings")
    // Explicit FK hint — recordings has TWO links to profiles (student_id,
    // reviewed_by), so an unhinted embed is ambiguous and PostgREST rejects it.
    .select("*, student:profiles!recordings_student_id_fkey(full_name)")
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
      reviewedBy,
    }: {
      id: string;
      status: RecordingStatus;
      reviewedAt?: string | null;
      /** Who submitted the review — matters with multiple teachers per class. */
      reviewedBy?: string;
      // Optional context for a richer notification (not persisted).
      teacherName?: string;
      label?: string;
    }): Promise<void> => {
      const patch: { status: RecordingStatus; reviewed_at?: string | null; reviewed_by?: string } = {
        status,
      };
      if (reviewedAt !== undefined) patch.reviewed_at = reviewedAt;
      if (status === "reviewed" && reviewedBy) patch.reviewed_by = reviewedBy;
      const { error } = await supabase.from("recordings").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: async (_data, vars) => {
      qc.invalidateQueries({ queryKey: recordingKeys.detail(vars.id) });
      qc.invalidateQueries({ queryKey: ["recordings"] });
      // Notify the student when their recording is published as reviewed.
      if (vars.status === "reviewed") {
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
            targetRole: "student",
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
  /** The assigned wird this recording fulfills (null for free recordings). */
  wirdId?: string | null;
  /** Sender's display name, for a richer notification (not persisted). */
  studentName?: string;
} & Partial<RecordingReference>;

export function useCreateRecording(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewRecordingInput): Promise<Recording> => {
      const path = `${studentId}/${Date.now()}.m4a`;
      const storedPath = await uploadAudio(input.localUri, "recordings", path);

      const { data, error } = await supabase
        .from("recordings")
        .insert({
          class_id: input.classId,
          student_id: studentId,
          label: input.label,
          audio_path: storedPath,
          duration_ms: Math.round(input.durationMs),
          responds_to_id: input.respondsToId ?? null,
          wird_id: input.wirdId ?? null,
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
      if (data?.class_id) {
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
            targetRole: "teacher",
          });
        }
      }
    },
  });
}
