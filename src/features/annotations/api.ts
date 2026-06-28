import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../config/supabase";
import { uploadAudio } from "../../lib/audio";
import { Annotation, Tag } from "../../types/database";

export type AnnotationWithTags = Annotation & { tags: Tag[] };

export const annotationKeys = {
  forRecording: (recordingId: string) => ["annotations", recordingId] as const,
  correctionUrl: (path: string) => ["correction-url", path] as const,
};

async function fetchAnnotations(recordingId: string): Promise<AnnotationWithTags[]> {
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
        voicePath = `${teacherId}/${Date.now()}.m4a`;
        await uploadAudio(input.voiceLocalUri, "corrections", voicePath);
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
      const { error } = await supabase.from("annotations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: annotationKeys.forRecording(recordingId) }),
  });
}

async function fetchCorrectionUrl(path: string): Promise<string> {
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
