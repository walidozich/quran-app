import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../config/supabase";
import { ClassRow, Sex } from "../../types/database";
import { genJoinCode, JoinClassError } from "./joinCode";

export { JoinClassError } from "./joinCode";

export type ClassMemberWithProfile = {
  id: string;
  joined_at: string;
  student: { id: string; full_name: string };
};

/** A class a student belongs to, with its owning teacher's name. */
export type ClassWithTeacher = ClassRow & { teacher: { full_name: string } | null };

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------
export const classKeys = {
  teacher: (teacherId: string) => ["classes", "teacher", teacherId] as const,
  members: (classId: string) => ["classes", "members", classId] as const,
  studentClasses: (studentId: string) => ["classes", "studentList", studentId] as const,
};

/** A class in the teaching list, with whether this profile owns it. */
export type TeachingClass = ClassRow & { is_owner: boolean };

/** Every class this profile teaches: owned + joined as co-teacher. */
async function fetchTeacherClasses(teacherId: string): Promise<TeachingClass[]> {
  const [owned, co] = await Promise.all([
    supabase.from("classes").select("*").eq("teacher_id", teacherId),
    supabase
      .from("class_teachers")
      .select("class:classes(*)")
      .eq("teacher_id", teacherId)
      .returns<{ class: ClassRow }[]>(),
  ]);
  if (owned.error) throw owned.error;
  if (co.error) throw co.error;
  const list: TeachingClass[] = [
    ...(owned.data ?? []).map((c) => ({ ...c, is_owner: true })),
    ...(co.data ?? []).map((r) => ({ ...r.class, is_owner: false })).filter((c) => c.id),
  ];
  return list.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function useTeacherClasses(teacherId: string) {
  return useQuery({
    queryKey: classKeys.teacher(teacherId),
    queryFn: () => fetchTeacherClasses(teacherId),
  });
}

/** Ids of every class the profile teaches (owned + co-taught) — for queue queries. */
export async function fetchTeachingClassIds(teacherId: string): Promise<string[]> {
  const classes = await fetchTeacherClasses(teacherId);
  return classes.map((c) => c.id);
}

async function fetchClassMembers(classId: string): Promise<ClassMemberWithProfile[]> {
  const { data, error } = await supabase
    .from("class_members")
    .select("id, joined_at, student:profiles(id, full_name)")
    .eq("class_id", classId)
    .order("joined_at", { ascending: true })
    .returns<ClassMemberWithProfile[]>();
  if (error) throw error;
  return data ?? [];
}

export function useClassMembers(classId: string | undefined) {
  return useQuery({
    queryKey: classKeys.members(classId ?? "none"),
    queryFn: () => fetchClassMembers(classId as string),
    enabled: Boolean(classId),
  });
}

async function fetchStudentClasses(studentId: string): Promise<ClassWithTeacher[]> {
  const { data, error } = await supabase
    .from("class_members")
    .select("class:classes(*, teacher:profiles(full_name))")
    .eq("student_id", studentId)
    .order("joined_at", { ascending: false })
    .returns<{ class: ClassWithTeacher }[]>();
  if (error) throw error;
  return (data ?? []).map((row) => row.class).filter(Boolean);
}

/** All classes a student has joined (Google-Classroom style — many per student). */
export function useStudentClasses(studentId: string) {
  return useQuery({
    queryKey: classKeys.studentClasses(studentId),
    queryFn: () => fetchStudentClasses(studentId),
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------
export function useCreateClass(teacherId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string): Promise<ClassRow> => {
      const { data, error } = await supabase
        .from("classes")
        .insert({ teacher_id: teacherId, name, join_code: genJoinCode() })
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: classKeys.teacher(teacherId) });
    },
  });
}

/** A join-code lookup, including the teacher's sex for the soft join warning. */
export type ClassPreview = ClassRow & { teacher: { full_name: string; sex: Sex } | null };

/** Resolve a join code to its class + teacher (null when the code is unknown). */
export async function lookupClassByCode(rawCode: string): Promise<ClassPreview | null> {
  const code = rawCode.trim().toUpperCase();
  const { data, error } = await supabase
    .from("classes")
    .select("*, teacher:profiles(full_name, sex)")
    .eq("join_code", code)
    .maybeSingle<ClassPreview>();
  if (error) throw error;
  return data ?? null;
}

export function useJoinClass(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cls: ClassRow): Promise<ClassRow> => {
      const { error: joinErr } = await supabase
        .from("class_members")
        .upsert(
          { class_id: cls.id, student_id: studentId },
          { onConflict: "class_id,student_id", ignoreDuplicates: true }
        );
      if (joinErr) throw joinErr;
      return cls;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: classKeys.studentClasses(studentId) });
    },
  });
}

export function useRenameClass(teacherId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ classId, name }: { classId: string; name: string }): Promise<void> => {
      const { error } = await supabase.from("classes").update({ name }).eq("id", classId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: classKeys.teacher(teacherId) }),
  });
}

export function useDeleteClass(teacherId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (classId: string): Promise<void> => {
      // FK cascades remove members, recordings, and annotations.
      const { error } = await supabase.from("classes").delete().eq("id", classId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: classKeys.teacher(teacherId) });
      qc.invalidateQueries({ queryKey: ["recordings"] });
    },
  });
}

// ---------------------------------------------------------------------------
// Co-teachers (v2 P6)
// ---------------------------------------------------------------------------
export type CoTeacher = { id: string; added_at: string; teacher: { id: string; full_name: string } };

/** The secret co-teacher join code — RLS returns it to the class OWNER only. */
export function useTeacherCode(classId: string, isOwner: boolean) {
  return useQuery({
    queryKey: ["classes", "teacher-code", classId],
    queryFn: async (): Promise<string | null> => {
      const { data, error } = await supabase
        .from("class_teacher_codes")
        .select("code")
        .eq("class_id", classId)
        .maybeSingle();
      if (error) throw error;
      return data?.code ?? null;
    },
    enabled: isOwner && Boolean(classId),
  });
}

export function useCoTeachers(classId: string) {
  return useQuery({
    queryKey: ["classes", "co-teachers", classId],
    queryFn: async (): Promise<CoTeacher[]> => {
      const { data, error } = await supabase
        .from("class_teachers")
        .select("id, added_at, teacher:profiles(id, full_name)")
        .eq("class_id", classId)
        .order("added_at", { ascending: true })
        .returns<CoTeacher[]>();
      if (error) throw error;
      return data ?? [];
    },
    enabled: Boolean(classId),
  });
}

/** Join a class as co-teacher with its secret code (validated server-side). */
export function useJoinAsTeacher(profileId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (code: string): Promise<string> => {
      const { data, error } = await supabase.rpc("join_class_as_teacher", {
        p_code: code.trim().toUpperCase(),
        p_profile: profileId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: classKeys.teacher(profileId) }),
  });
}

/** Owner removes a co-teacher, or a co-teacher leaves (same row deletion). */
export function useRemoveCoTeacher(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rowId: string): Promise<void> => {
      const { error } = await supabase.from("class_teachers").delete().eq("id", rowId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["classes", "co-teachers", classId] });
      qc.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}

export function useRemoveMember(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (studentId: string): Promise<void> => {
      const { error } = await supabase
        .from("class_members")
        .delete()
        .eq("class_id", classId)
        .eq("student_id", studentId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: classKeys.members(classId) }),
  });
}
