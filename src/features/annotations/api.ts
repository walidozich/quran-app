import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { USE_LOCAL_BACKEND } from "../../config/backend";
import { supabase } from "../../config/supabase";
import { t } from "../../i18n/ar";
import { uploadAudio } from "../../lib/audio";
import { Annotation, AnnotationReply, Tag } from "../../types/database";
import { sendPushToProfile } from "../notifications/push";
import {
  localAddReply,
  localDeleteAnnotation,
  localFetchAnnotations,
  localFetchReplies,
  localFetchTeacherAnnotations,
  localInsertAnnotation,
  localSetResolved,
  localUpdateAnnotation,
} from "../local/localApi";

export type AnnotationWithTags = Annotation & { tags: Tag[] };
export type ReplyWithAuthor = AnnotationReply & { author: { full_name: string } | null };

export const annotationKeys = {
  forRecording: (recordingId: string) => ["annotations", recordingId] as const,
  replies: (annotationId: string) => ["annotation-replies", annotationId] as const,
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
  endMs?: number | null;
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

      const endMs = input.endMs != null ? Math.round(input.endMs) : null;
      if (USE_LOCAL_BACKEND) {
        return localInsertAnnotation({
          recordingId,
          teacherId,
          timestampMs: input.timestampMs,
          endMs,
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
          end_ms: endMs,
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

// --- per-annotation replies + resolve --------------------------------------
async function fetchReplies(annotationId: string): Promise<ReplyWithAuthor[]> {
  if (USE_LOCAL_BACKEND) return localFetchReplies(annotationId);
  const { data, error } = await supabase
    .from("annotation_replies")
    .select("*, author:profiles(full_name)")
    .eq("annotation_id", annotationId)
    .order("created_at", { ascending: true })
    .returns<ReplyWithAuthor[]>();
  if (error) throw error;
  return data ?? [];
}

export function useAnnotationReplies(annotationId: string) {
  return useQuery({
    queryKey: annotationKeys.replies(annotationId),
    queryFn: () => fetchReplies(annotationId),
  });
}

/**
 * Notify the *other* party in an annotation conversation that a reply arrived:
 * if the teacher replied, ping the student, and vice versa. Best-effort.
 */
async function notifyReplyRecipient(
  annotationId: string,
  authorId: string,
  replyText: string
): Promise<void> {
  try {
    const { data: ann } = await supabase
      .from("annotations")
      .select("teacher_id, recording_id")
      .eq("id", annotationId)
      .maybeSingle();
    if (!ann) return;
    const { data: rec } = await supabase
      .from("recordings")
      .select("student_id")
      .eq("id", ann.recording_id)
      .maybeSingle();
    if (!rec) return;
    const recipient = authorId === ann.teacher_id ? rec.student_id : ann.teacher_id;
    if (!recipient || recipient === authorId) return;

    const { data: author } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", authorId)
      .maybeSingle();
    const snippet = replyText.length > 60 ? `${replyText.slice(0, 60)}…` : replyText;
    const body = author?.full_name ? `${author.full_name}: ${snippet}` : t("notif.replyBody");
    sendPushToProfile(recipient, t("notif.replyTitle"), body, {
      recordingId: ann.recording_id,
    });
  } catch {
    // never block the reply on a failed notification lookup
  }
}

export function useAddReply(annotationId: string, authorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: string): Promise<void> => {
      const text = body.trim();
      if (!text) return;
      if (USE_LOCAL_BACKEND) return localAddReply(annotationId, authorId, text);
      const { error } = await supabase
        .from("annotation_replies")
        .insert({ annotation_id: annotationId, author_id: authorId, body: text });
      if (error) throw error;
      await notifyReplyRecipient(annotationId, authorId, text);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: annotationKeys.replies(annotationId) }),
  });
}

/** Teacher-only: mark an annotation resolved / unresolved. */
export function useSetResolved(recordingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, resolved }: { id: string; resolved: boolean }): Promise<void> => {
      if (USE_LOCAL_BACKEND) return localSetResolved(id, resolved);
      const { error } = await supabase.from("annotations").update({ resolved }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: annotationKeys.forRecording(recordingId) }),
  });
}
