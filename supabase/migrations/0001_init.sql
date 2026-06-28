-- Quran Learning Platform — initial schema (Phase 2)
-- NOTE: RLS policies here are PERMISSIVE FOR DEVELOPMENT (no real auth yet).
-- Phase 9 replaces every "_dev_" policy with auth.uid()-scoped rules.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type user_role as enum ('teacher', 'student');
create type recording_status as enum ('pending', 'in_review', 'reviewed');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table profiles (
  id          uuid primary key default gen_random_uuid(),
  full_name   text not null,
  role        user_role not null,
  created_at  timestamptz not null default now()
);

create table classes (
  id          uuid primary key default gen_random_uuid(),
  teacher_id  uuid not null references profiles(id) on delete cascade,
  name        text not null,
  join_code   text not null unique,
  created_at  timestamptz not null default now()
);

create table class_members (
  id          uuid primary key default gen_random_uuid(),
  class_id    uuid not null references classes(id) on delete cascade,
  student_id  uuid not null references profiles(id) on delete cascade,
  joined_at   timestamptz not null default now(),
  unique (class_id, student_id)
);

create table recordings (
  id              uuid primary key default gen_random_uuid(),
  class_id        uuid not null references classes(id) on delete cascade,
  student_id      uuid not null references profiles(id) on delete cascade,
  label           text not null,
  audio_path      text not null,
  duration_ms     integer not null default 0,
  responds_to_id  uuid references recordings(id) on delete set null,
  status          recording_status not null default 'pending',
  reviewed_at     timestamptz,
  created_at      timestamptz not null default now()
);

create table annotations (
  id                 uuid primary key default gen_random_uuid(),
  recording_id       uuid not null references recordings(id) on delete cascade,
  teacher_id         uuid not null references profiles(id) on delete cascade,
  timestamp_ms       integer not null,
  comment_text       text,
  voice_path         text,
  voice_duration_ms  integer,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table tags (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  color       text not null default '#0E5E4E',
  is_seeded   boolean not null default false,
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table annotation_tags (
  annotation_id  uuid not null references annotations(id) on delete cascade,
  tag_id         uuid not null references tags(id) on delete cascade,
  primary key (annotation_id, tag_id)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index idx_recordings_class      on recordings(class_id);
create index idx_recordings_student    on recordings(student_id);
create index idx_recordings_responds   on recordings(responds_to_id);
create index idx_annotations_recording on annotations(recording_id);
create index idx_annotation_tags_tag   on annotation_tags(tag_id);
create index idx_class_members_student on class_members(student_id);

-- ---------------------------------------------------------------------------
-- Row Level Security (DEV-PERMISSIVE — replaced in Phase 9)
-- ---------------------------------------------------------------------------
alter table profiles        enable row level security;
alter table classes         enable row level security;
alter table class_members   enable row level security;
alter table recordings      enable row level security;
alter table annotations     enable row level security;
alter table tags            enable row level security;
alter table annotation_tags enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'profiles','classes','class_members','recordings',
    'annotations','tags','annotation_tags'
  ]
  loop
    execute format(
      'create policy "_dev_all_%1$s" on %1$s for all to anon, authenticated using (true) with check (true)',
      t
    );
  end loop;
end $$;

-- Expose tables to the Data API for the dev roles.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage buckets (private) + DEV-PERMISSIVE policies
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('recordings', 'recordings', false), ('corrections', 'corrections', false)
on conflict (id) do nothing;

create policy "_dev_storage_all"
  on storage.objects for all to anon, authenticated
  using (bucket_id in ('recordings', 'corrections'))
  with check (bucket_id in ('recordings', 'corrections'));

-- ---------------------------------------------------------------------------
-- Seed: common Tajweed/recitation mistake tags (Arabic)
-- ---------------------------------------------------------------------------
insert into tags (name, color, is_seeded) values
  ('مدّ',          '#0E5E4E', true),
  ('غُنّة',        '#1B7A63', true),
  ('قلقلة',        '#C9A227', true),
  ('إدغام',        '#8A6D1F', true),
  ('إخفاء',        '#2E7D5B', true),
  ('إظهار',        '#5B7B8A', true),
  ('مخرج الحرف',   '#B4413C', true),
  ('كلمة ناقصة',   '#9C5A3C', true),
  ('كلمة زائدة',   '#7A5C9C', true),
  ('وقف وابتداء',  '#3C7A9C', true),
  ('تشكيل',        '#6B7280', true)
on conflict (name) do nothing;

-- ---------------------------------------------------------------------------
-- Seed: dev profiles (used by the Phase 2 dev session stub; removed at Phase 9)
-- ---------------------------------------------------------------------------
insert into profiles (id, full_name, role) values
  ('11111111-1111-1111-1111-111111111111', 'الأستاذ أحمد', 'teacher'),
  ('22222222-2222-2222-2222-222222222222', 'الطالب يوسف',  'student')
on conflict (id) do nothing;
