-- Annotation ranges (optional end), a resolved flag, and per-annotation replies.

alter table annotations add column if not exists end_ms integer;
alter table annotations add column if not exists resolved boolean not null default false;

create table if not exists annotation_replies (
  id            uuid primary key default gen_random_uuid(),
  annotation_id uuid not null references annotations(id) on delete cascade,
  author_id     uuid not null references profiles(id) on delete cascade,
  body          text not null,
  created_at    timestamptz not null default now()
);
create index if not exists idx_annotation_replies_annotation on annotation_replies(annotation_id);

alter table annotation_replies enable row level security;

-- Visible/writable to the annotation's teacher, or the recording's student once reviewed.
create policy "replies_select" on annotation_replies for select to authenticated using (
  annotation_id in (
    select a.id from annotations a join recordings r on r.id = a.recording_id
    where a.teacher_id = auth.uid()
       or (r.student_id = auth.uid() and r.status = 'reviewed')
  )
);
create policy "replies_insert" on annotation_replies for insert to authenticated with check (
  author_id = auth.uid()
  and annotation_id in (
    select a.id from annotations a join recordings r on r.id = a.recording_id
    where a.teacher_id = auth.uid()
       or (r.student_id = auth.uid() and r.status = 'reviewed')
  )
);

grant select, insert on annotation_replies to authenticated;
