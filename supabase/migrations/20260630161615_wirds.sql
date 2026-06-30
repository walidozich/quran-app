-- Teacher-assigned tasks (wird). See spec.md §11.

create table if not exists wirds (
  id            uuid primary key default gen_random_uuid(),
  class_id      uuid not null references classes(id) on delete cascade,
  teacher_id    uuid not null references profiles(id) on delete cascade,
  student_id    uuid references profiles(id) on delete cascade, -- null = whole class
  ref_type      recording_ref_type,
  surah_start   smallint,
  ayah_start    smallint,
  surah_end     smallint,
  ayah_end      smallint,
  page_start    smallint,
  page_end      smallint,
  title         text,
  note          text,
  due_at        timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists idx_wirds_class on wirds(class_id);
create index if not exists idx_wirds_student on wirds(student_id);

-- Link a recording to the wird it fulfills (free recordings leave it null).
alter table recordings add column if not exists wird_id uuid references wirds(id) on delete set null;
create index if not exists idx_recordings_wird on recordings(wird_id);

-- Per-student completion (teacher-marked); a row's presence = complete.
create table if not exists wird_completions (
  id            uuid primary key default gen_random_uuid(),
  wird_id       uuid not null references wirds(id) on delete cascade,
  student_id    uuid not null references profiles(id) on delete cascade,
  completed_at  timestamptz not null default now(),
  completed_by  uuid references profiles(id) on delete set null,
  unique (wird_id, student_id)
);
create index if not exists idx_wird_completions_wird on wird_completions(wird_id);

alter table wirds enable row level security;
alter table wird_completions enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='wirds' and policyname='wirds_select') then
    create policy "wirds_select" on wirds for select to authenticated using (
      class_id in (select id from classes where teacher_id = auth.uid())
      or (
        (student_id is null or student_id = auth.uid())
        and class_id in (select class_id from class_members where student_id = auth.uid())
      )
    );
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='wirds' and policyname='wirds_insert') then
    create policy "wirds_insert" on wirds for insert to authenticated with check (
      teacher_id = auth.uid() and class_id in (select id from classes where teacher_id = auth.uid())
    );
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='wirds' and policyname='wirds_update') then
    create policy "wirds_update" on wirds for update to authenticated
      using (class_id in (select id from classes where teacher_id = auth.uid()))
      with check (class_id in (select id from classes where teacher_id = auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='wirds' and policyname='wirds_delete') then
    create policy "wirds_delete" on wirds for delete to authenticated
      using (class_id in (select id from classes where teacher_id = auth.uid()));
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='wird_completions' and policyname='wird_completions_select') then
    create policy "wird_completions_select" on wird_completions for select to authenticated using (
      student_id = auth.uid()
      or wird_id in (select w.id from wirds w join classes c on c.id = w.class_id where c.teacher_id = auth.uid())
    );
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='wird_completions' and policyname='wird_completions_insert') then
    create policy "wird_completions_insert" on wird_completions for insert to authenticated with check (
      completed_by = auth.uid()
      and wird_id in (select w.id from wirds w join classes c on c.id = w.class_id where c.teacher_id = auth.uid())
    );
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='wird_completions' and policyname='wird_completions_delete') then
    create policy "wird_completions_delete" on wird_completions for delete to authenticated using (
      wird_id in (select w.id from wirds w join classes c on c.id = w.class_id where c.teacher_id = auth.uid())
    );
  end if;
end $$;

grant select, insert, update, delete on wirds to authenticated;
grant select, insert, delete on wird_completions to authenticated;
