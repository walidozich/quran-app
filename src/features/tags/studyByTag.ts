import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../config/supabase";
import { Annotation, Tag } from "../../types/database";

export type StudyAnnotation = Annotation & {
  tags: Tag[];
  recording: { id: string; label: string };
};

/**
 * All annotations across the student's *reviewed* recordings, with their tags
 * and the parent recording label. Filtering by a specific tag is done client-side.
 */
async function fetchStudentAnnotations(studentId: string): Promise<StudyAnnotation[]> {
  const { data, error } = await supabase
    .from("annotations")
    .select("*, tags(*), recording:recordings!inner(id, label, student_id, status)")
    .eq("recording.student_id", studentId)
    .eq("recording.status", "reviewed")
    .order("created_at", { ascending: false })
    .returns<StudyAnnotation[]>();
  if (error) throw error;
  return data ?? [];
}

export function useStudentAnnotations(studentId: string) {
  return useQuery({
    queryKey: ["study", studentId],
    queryFn: () => fetchStudentAnnotations(studentId),
  });
}
