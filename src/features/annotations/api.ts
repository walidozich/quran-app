import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { USE_LOCAL_BACKEND } from "../../config/backend";
import { supabase } from "../../config/supabase";
import { uploadAudio } from "../../lib/audio";
import { Annotation, Tag } from "../../types/database";
import {
  localDeleteAnnotation,
  localFetchAnnotations,
  localFetchTeacherAnnotations,
  localInsertAnnotation,
  localUpdateAnnotation,
} from "../local/localApi";

export type AnnotationWithTags = Annotation & { tags: Tag[] };

export const annotationKeys = {
  forRecording: (recordingId: string) => ["annotations", recordingId] as const,
  correctionUrl: (path: string) => ["correction-url", path] as const,
};

async function fetchAnnotations(recordingId: string): Promise<AnnotationWithTags[]> {
  if (USE_LOCAL_BACKEND) return localFetchAnnotations(recordingId);
  const { data, error } = await supabase
    .from("annotations")
    .select("*, tags(*)")
    .eq("recording_id", recordingId)
    .order("timestamp_ms", { ascending: true })
    .returns<AnnotationWithTags[]>();
  if (error) throw error;
  return data ?? [];
}

export function useAnnotations(recordingId: string) {
  return useQuery({
    queryKey: annotationKeys.forRecording(recordingId),
    queryFn: () => fetchAnnotations(recordingId),
  });
}

/** Every annotation a teacher has authored, with tags — powers the dashboard. */
async function fetchTeacherAnnotations(teacherId: string): Promise<AnnotationWithTags[]> {
  if (USE_LOCAL_BACKEND) return localFetchTeacherAnnotations(teacherId);
  const { data, error } = await supabase
    .from("annotations")
    .select("*, tags(*)")
    .eq("teacher_id", teacherId)
    .returns<AnnotationWithTags[]>();
  if (error) throw error;
  return data ?? [];
}

export function useTeacherAnnotations(teacherId: string) {
  return useQuery({
    queryKey: ["annotations", "teacher", teacherId],
    queryFn: () => fetchTeacherAnnotations(teacherId),
  });
}

async function setAnnotationTags(annotationId: string, tagIds: string[]): Promise<void> {
  await supabase.from("annotation_tags").delete().eq("annotation_id", annotationId);
  if (tagIds.length > 0) {
    const rows = tagIds.map((tag_id) => ({ annotation_id: annotationId, tag_id }));
    const { error } = await supabase.from("annotation_tags").insert(rows);
    if (error) throw error;
  }
}

export type NewAnnotationInput = {
  timestampMs: number;
  commentText: string | null;
  voiceLocalUri: string | null;
  voiceDurationMs: number | null;
  tagIds: string[];
};

export function useCreateAnnotation(recordingId: string, teacherId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewAnnotationInput): Promise<string> => {
      let voicePath: string | null = null;
      if (input.voiceLocalUri) {
        const name = `${teacherId}/${Date.now()}.m4a`;
        voicePath = await uploadAudio(input.voiceLocalUri, "corrections", name);
      }

      if (USE_LOCAL_BACKEND) {
        return localInsertAnnotation({
          recordingId,
          teacherId,
          timestampMs: input.timestampMs,
          commentText: input.commentText,
          voicePath,
          voiceDurationMs: input.voiceDurationMs,
          tagIds: input.tagIds,
        });
      }

      const { data, error } = await supabase
        .from("annotations")
        .insert({
          recording_id: recordingId,
          teacher_id: teacherId,
          timestamp_ms: Math.round(input.timestampMs),
          comment_text: input.commentText,
          voice_path: voicePath,
          voice_duration_ms: input.voiceDurationMs,
        })
        .select("id")
        .single();
      if (error) throw error;
      await setAnnotationTags(data.id, input.tagIds);
      return data.id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: annotationKeys.forRecording(recordingId) }),
  });
}

export type UpdateAnnotationInput = {
  id: string;
  commentText: string | null;
  tagIds: string[];
};

export function useUpdateAnnotation(recordingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateAnnotationInput): Promise<void> => {
      if (USE_LOCAL_BACKEND) return localUpdateAnnotation(input.id, input.commentText, input.tagIds);
      const { error } = await supabase
        .from("annotations")
        .update({ comment_text: input.commentText, updated_at: new Date().toISOString() })
        .eq("id", input.id);
      if (error) throw error;
      await setAnnotationTags(input.id, input.tagIds);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: annotationKeys.forRecording(recordingId) }),
  });
}

export function useDeleteAnnotation(recordingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      if (USE_LOCAL_BACKEND) return localDeleteAnnotation(id);
      const { error } = await supabase.from("annotations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: annotationKeys.forRecording(recordingId) }),
  });
}

async function fetchCorrectionUrl(path: string): Promise<string> {
  if (USE_LOCAL_BACKEND) return path;
  const { data, error } = await supabase.storage.from("corrections").createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}

export function useCorrectionUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: annotationKeys.correctionUrl(path ?? "none"),
    queryFn: () => fetchCorrectionUrl(path as string),
    enabled: Boolean(path),
    staleTime: 50 * 60 * 1000,
  });
}
