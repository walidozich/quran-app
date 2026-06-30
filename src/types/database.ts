// Hand-written to match supabase/migrations/0001_init.sql.
// Phase 9 can regenerate this from the live project via `supabase gen types`.
// NOTE: these MUST be `type` aliases (not `interface`) so they are assignable
// to Record<string, unknown> and satisfy supabase-js's GenericSchema constraint.

export type UserRole = "teacher" | "student";
export type RecordingStatus = "pending" | "in_review" | "reviewed";

export type Profile = {
  id: string;
  full_name: string;
  role: UserRole;
  whatsapp: string | null;
  expo_push_token?: string | null;
  created_at: string;
};

export type ClassRow = {
  id: string;
  teacher_id: string;
  name: string;
  join_code: string;
  created_at: string;
};

export type ClassMember = {
  id: string;
  class_id: string;
  student_id: string;
  joined_at: string;
};

export type RecordingRefType = "ayah" | "page";

export type RecordingReference = {
  ref_type: RecordingRefType | null;
  surah_start: number | null;
  ayah_start: number | null;
  surah_end: number | null;
  ayah_end: number | null;
  page_start: number | null;
  page_end: number | null;
};

export type Recording = {
  id: string;
  class_id: string;
  student_id: string;
  label: string;
  audio_path: string;
  duration_ms: number;
  responds_to_id: string | null;
  status: RecordingStatus;
  reviewed_at: string | null;
  created_at: string;
  // Structured Quran reference captured by the ayah picker (null for custom names).
  ref_type?: RecordingRefType | null;
  surah_start?: number | null;
  ayah_start?: number | null;
  surah_end?: number | null;
  ayah_end?: number | null;
  page_start?: number | null;
  page_end?: number | null;
  // The assigned wird this recording fulfills (null for free recordings).
  wird_id?: string | null;
};

/** A teacher-assigned task (ورد). student_id null = assigned to the whole class. */
export type Wird = RecordingReference & {
  id: string;
  class_id: string;
  teacher_id: string;
  student_id: string | null;
  title: string | null;
  note: string | null;
  due_at: string | null;
  created_at: string;
};

/** Presence of a row = the teacher marked that student's wird complete. */
export type WirdCompletion = {
  id: string;
  wird_id: string;
  student_id: string;
  completed_at: string;
  completed_by: string | null;
};

export type Annotation = {
  id: string;
  recording_id: string;
  teacher_id: string;
  timestamp_ms: number;
  end_ms?: number | null; // when set, the annotation covers a range [timestamp_ms, end_ms]
  resolved?: boolean;
  comment_text: string | null;
  voice_path: string | null;
  voice_duration_ms: number | null;
  created_at: string;
  updated_at: string;
};

export type AnnotationReply = {
  id: string;
  annotation_id: string;
  author_id: string;
  body: string;
  created_at: string;
};

export type NotificationRow = {
  id: string;
  recipient_id: string;
  actor_id: string | null;
  type: string | null;
  title: string;
  body: string | null;
  recording_id: string | null;
  read: boolean;
  created_at: string;
};

export type Tag = {
  id: string;
  name: string;
  color: string;
  is_seeded: boolean;
  created_by: string | null;
  created_at: string;
};

export type AnnotationTag = {
  annotation_id: string;
  tag_id: string;
};

type Table<T> = { Row: T; Insert: Partial<T>; Update: Partial<T>; Relationships: [] };

export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile>;
      classes: Table<ClassRow>;
      class_members: Table<ClassMember>;
      recordings: Table<Recording>;
      annotations: Table<Annotation>;
      annotation_replies: Table<AnnotationReply>;
      notifications: Table<NotificationRow>;
      tags: Table<Tag>;
      annotation_tags: Table<AnnotationTag>;
      wirds: Table<Wird>;
      wird_completions: Table<WirdCompletion>;
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      user_role: UserRole;
      recording_status: RecordingStatus;
      recording_ref_type: RecordingRefType;
    };
  };
};
