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
};

export type Annotation = {
  id: string;
  recording_id: string;
  teacher_id: string;
  timestamp_ms: number;
  comment_text: string | null;
  voice_path: string | null;
  voice_duration_ms: number | null;
  created_at: string;
  updated_at: string;
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
      tags: Table<Tag>;
      annotation_tags: Table<AnnotationTag>;
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      user_role: UserRole;
      recording_status: RecordingStatus;
    };
  };
};
