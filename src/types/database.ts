// Hand-written to match supabase/migrations/0001_init.sql.
// Phase 9 can regenerate this from the live project via `supabase gen types`.

export type UserRole = "teacher" | "student";
export type RecordingStatus = "pending" | "in_review" | "reviewed";

type Timestamps = { created_at: string };

export interface Profile extends Timestamps {
  id: string;
  full_name: string;
  role: UserRole;
}

export interface ClassRow extends Timestamps {
  id: string;
  teacher_id: string;
  name: string;
  join_code: string;
}

export interface ClassMember {
  id: string;
  class_id: string;
  student_id: string;
  joined_at: string;
}

export interface Recording extends Timestamps {
  id: string;
  class_id: string;
  student_id: string;
  label: string;
  audio_path: string;
  duration_ms: number;
  responds_to_id: string | null;
  status: RecordingStatus;
  reviewed_at: string | null;
}

export interface Annotation {
  id: string;
  recording_id: string;
  teacher_id: string;
  timestamp_ms: number;
  comment_text: string | null;
  voice_path: string | null;
  voice_duration_ms: number | null;
  created_at: string;
  updated_at: string;
}

export interface Tag extends Timestamps {
  id: string;
  name: string;
  color: string;
  is_seeded: boolean;
  created_by: string | null;
}

export interface AnnotationTag {
  annotation_id: string;
  tag_id: string;
}

type Row<T> = { Row: T; Insert: Partial<T>; Update: Partial<T> };

export interface Database {
  public: {
    Tables: {
      profiles: Row<Profile>;
      classes: Row<ClassRow>;
      class_members: Row<ClassMember>;
      recordings: Row<Recording>;
      annotations: Row<Annotation>;
      tags: Row<Tag>;
      annotation_tags: Row<AnnotationTag>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      recording_status: RecordingStatus;
    };
  };
}
