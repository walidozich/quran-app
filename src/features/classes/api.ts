import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { USE_LOCAL_BACKEND } from "../../config/backend";
import { supabase } from "../../config/supabase";
import { ClassRow } from "../../types/database";
import {
  localCreateClass,
  localDeleteClass,
  localFetchClassMembers,
  localFetchStudentClasses,
  localFetchTeacherClasses,
  localJoinClass,
  localRemoveMember,
  localRenameClass,
} from "../local/localApi";
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

async function fetchTeacherClasses(teacherId: string): Promise<ClassRow[]> {
  if (USE_LOCAL_BACKEND) return localFetchTeacherClasses(teacherId);
  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export function useTeacherClasses(teacherId: string) {
  return useQuery({
    queryKey: classKeys.teacher(teacherId),
    queryFn: () => fetchTeacherClasses(teacherId),
  });
}

async function fetchClassMembers(classId: string): Promise<ClassMemberWithProfile[]> {
  if (USE_LOCAL_BACKEND) return localFetchClassMembers(classId);
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
  if (USE_LOCAL_BACKEND) return localFetchStudentClasses(studentId);
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
      if (USE_LOCAL_BACKEND) return localCreateClass(teacherId, name);
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

export function useJoinClass(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rawCode: string): Promise<ClassRow> => {
      if (USE_LOCAL_BACKEND) return localJoinClass(studentId, rawCode);
      const code = rawCode.trim().toUpperCase();
      const { data: cls, error: findErr } = await supabase
        .from("classes")
        .select("*")
        .eq("join_code", code)
        .maybeSingle();
      if (findErr) throw findErr;
      if (!cls) throw new JoinClassError("not_found");

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
      if (USE_LOCAL_BACKEND) return localRenameClass(classId, name);
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
      if (USE_LOCAL_BACKEND) return localDeleteClass(classId);
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

export function useRemoveMember(classId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (studentId: string): Promise<void> => {
      if (USE_LOCAL_BACKEND) return localRemoveMember(classId, studentId);
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
