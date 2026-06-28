import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../config/supabase";
import { uploadAudio } from "../../lib/audio";
import { Recording } from "../../types/database";

export const recordingKeys = {
  student: (studentId: string) => ["recordings", "student", studentId] as const,
  class: (classId: string) => ["recordings", "class", classId] as const,
  detail: (id: string) => ["recordings", "detail", id] as const,
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

export type NewRecordingInput = {
  classId: string;
  label: string;
  localUri: string;
  durationMs: number;
  respondsToId?: string | null;
};

export function useCreateRecording(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewRecordingInput): Promise<Recording> => {
      const path = `${studentId}/${Date.now()}.m4a`;
      await uploadAudio(input.localUri, "recordings", path);

      const { data, error } = await supabase
        .from("recordings")
        .insert({
          class_id: input.classId,
          student_id: studentId,
          label: input.label,
          audio_path: path,
          duration_ms: Math.round(input.durationMs),
          responds_to_id: input.respondsToId ?? null,
          status: "pending",
        })
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recordingKeys.student(studentId) });
    },
  });
}
