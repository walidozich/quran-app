import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../config/supabase";
import { RecordingReference, Wird, WirdCompletion } from "../../types/database";

export const wirdKeys = {
  forClass: (classId: string) => ["wirds", classId] as const,
  completions: ["wird-completions"] as const,
};

export type NewWirdInput = RecordingReference & {
  classId: string;
  teacherId: string;
  studentId: string | null;
  title: string | null;
  note: string | null;
  dueAt: string | null;
};

// --- queries ---------------------------------------------------------------

async function fetchClassWirds(classId: string): Promise<Wird[]> {
  const { data, error } = await supabase
    .from("wirds")
    .select("*")
    .eq("class_id", classId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Wirds for a class. RLS scopes rows: teacher sees all; a student sees class-wide + own. */
export function useClassWirds(classId: string) {
  return useQuery({
    queryKey: wirdKeys.forClass(classId),
    queryFn: () => fetchClassWirds(classId),
    enabled: Boolean(classId),
  });
}

async function fetchMyWirds(): Promise<Wird[]> {
  const { data, error } = await supabase
    .from("wirds")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** All wirds visible to the current user (RLS-scoped): a teacher's class wirds, or a student's. */
export function useMyWirds() {
  return useQuery({
    queryKey: ["wirds", "mine"],
    queryFn: fetchMyWirds,
  });
}

async function fetchWirdCompletions(wirdIds: string[]): Promise<WirdCompletion[]> {
  if (wirdIds.length === 0) return [];
  const { data, error } = await supabase.from("wird_completions").select("*").in("wird_id", wirdIds);
  if (error) throw error;
  return data ?? [];
}

/** Completion rows for the given wirds (presence = that student's wird is complete). */
export function useWirdCompletions(wirdIds: string[]) {
  return useQuery({
    queryKey: [...wirdKeys.completions, [...wirdIds].sort().join(",")],
    queryFn: () => fetchWirdCompletions(wirdIds),
    enabled: wirdIds.length > 0,
  });
}

// --- mutations -------------------------------------------------------------

export function useCreateWird() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewWirdInput): Promise<Wird> => {
      const { data, error } = await supabase
        .from("wirds")
        .insert({
          class_id: input.classId,
          teacher_id: input.teacherId,
          student_id: input.studentId,
          ref_type: input.ref_type,
          surah_start: input.surah_start,
          ayah_start: input.ayah_start,
          surah_end: input.surah_end,
          ayah_end: input.ayah_end,
          page_start: input.page_start,
          page_end: input.page_end,
          title: input.title,
          note: input.note,
          due_at: input.dueAt,
        })
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: wirdKeys.forClass(vars.classId) }),
  });
}

export function useUpdateWird(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Wird> }): Promise<void> => {
      const { error } = await supabase.from("wirds").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: wirdKeys.forClass(classId) }),
  });
}

export function useDeleteWird(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.from("wirds").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: wirdKeys.forClass(classId) });
      // Recordings keep their rows but their wird_id is now null.
      qc.invalidateQueries({ queryKey: ["recordings"] });
    },
  });
}

/** Teacher toggles a student's wird complete (insert) / incomplete (delete). */
export function useSetWirdComplete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      wirdId: string;
      studentId: string;
      teacherId: string;
      completed: boolean;
    }): Promise<void> => {
      if (input.completed) {
        const { error } = await supabase.from("wird_completions").upsert(
          {
            wird_id: input.wirdId,
            student_id: input.studentId,
            completed_by: input.teacherId,
            completed_at: new Date().toISOString(),
          },
          { onConflict: "wird_id,student_id" }
        );
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("wird_completions")
          .delete()
          .eq("wird_id", input.wirdId)
          .eq("student_id", input.studentId);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: wirdKeys.completions }),
  });
}
