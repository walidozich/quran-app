-- v2 P6 — multiple teachers per class.
-- The class keeps its OWNER (classes.teacher_id = creator). Co-teachers join
-- via a secret per-class TEACHER CODE and get full teaching rights (review,
-- wirds, completions). Rename/delete class and roster administration stay
-- with the owner.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists class_teachers (
  id          uuid primary key default gen_random_uuid(),
  class_id    uuid not null references classes(id) on delete cascade,
  teacher_id  uuid not null references profiles(id) on delete cascade,
  added_at    timestamptz not null default now(),
  unique (class_id, teacher_id)
);
create index if not exists idx_class_teachers_teacher on class_teachers(teacher_id);

-- The teacher code lives in its own table (NOT a classes column) so the open
-- `select *` on classes can never leak it. RLS: only the owner reads it.
create table if not exists class_teacher_codes (
  class_id  uuid primary key references classes(id) on delete cascade,
  code      text not null unique,
  created_at timestamptz not null default now()
);

alter table class_teachers enable row level security;
alter table class_teacher_codes enable row level security;

-- ---------------------------------------------------------------------------
-- Auto-generate a teacher code for every class (trigger + backfill)
-- ---------------------------------------------------------------------------
create or replace function public.gen_class_teacher_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare i int := 0;
begin
  loop
    begin
      insert into class_teacher_codes (class_id, code)
      values (new.id, upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6)));
      return new;
    exception when unique_violation then
      i := i + 1;
      if i > 5 then raise; end if;
    end;
  end loop;
end;
$$;
revoke all on function public.gen_class_teacher_code() from public, anon, authenticated;

drop trigger if exists trg_class_teacher_code on classes;
create trigger trg_class_teacher_code
  after insert on classes
  for each row execute function public.gen_class_teacher_code();

insert into class_teacher_codes (class_id, code)
select c.id, upper(substring(md5(random()::text || c.id::text) from 1 for 6))
from classes c
where not exists (select 1 from class_teacher_codes t where t.class_id = c.id);

-- ---------------------------------------------------------------------------
-- Helper: every class the caller teaches (owned OR co-teaching)
-- ---------------------------------------------------------------------------
create or replace function public.my_teaching_class_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from classes where teacher_id in (select public.my_profile_ids())
  union
  select class_id from class_teachers where teacher_id in (select public.my_profile_ids())
$$;
revoke all on function public.my_teaching_class_ids() from public, anon, authenticated;
grant execute on function public.my_teaching_class_ids() to authenticated;

-- ---------------------------------------------------------------------------
-- Join-as-co-teacher RPC: validates the secret code SERVER-SIDE (security
-- definer), so knowing the students' join code is never enough.
-- ---------------------------------------------------------------------------
create or replace function public.join_class_as_teacher(p_code text, p_profile uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_class uuid;
begin
  if p_profile not in (select public.my_profile_ids()) then
    raise exception 'not_your_profile';
  end if;
  if not exists (select 1 from profiles where id = p_profile and is_teacher) then
    raise exception 'not_a_teacher';
  end if;
  select class_id into v_class
  from class_teacher_codes
  where code = upper(trim(p_code));
  if v_class is null then
    raise exception 'code_not_found';
  end if;
  if exists (select 1 from classes where id = v_class and teacher_id = p_profile) then
    raise exception 'own_class';
  end if;
  if exists (select 1 from class_members where class_id = v_class and student_id = p_profile) then
    raise exception 'already_student';
  end if;
  insert into class_teachers (class_id, teacher_id)
  values (v_class, p_profile)
  on conflict (class_id, teacher_id) do nothing;
  return v_class;
end;
$$;
revoke all on function public.join_class_as_teacher(text, uuid) from public, anon, authenticated;
grant execute on function public.join_class_as_teacher(text, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS: new tables
-- ---------------------------------------------------------------------------
-- Teacher list: visible to the class's teachers and its students.
create policy "class_teachers_select" on class_teachers for select to authenticated
  using (
    class_id in (select public.my_teaching_class_ids())
    or class_id in (select class_id from class_members where student_id in (select public.my_profile_ids()))
  );
-- No INSERT policy: joining happens only through the code-validating RPC.
-- Removal: the class owner, or the co-teacher themselves (leaving).
create policy "class_teachers_delete" on class_teachers for delete to authenticated
  using (
    class_id in (select id from classes where teacher_id in (select public.my_profile_ids()))
    or teacher_id in (select public.my_profile_ids())
  );

-- The secret code: owner only.
create policy "class_teacher_codes_select" on class_teacher_codes for select to authenticated
  using (class_id in (select id from classes where teacher_id in (select public.my_profile_ids())));

grant select, delete on class_teachers to authenticated;
grant select on class_teacher_codes to authenticated;

-- ---------------------------------------------------------------------------
-- RLS: extend every "teacher of the class" policy to include co-teachers
-- (classes update/delete intentionally stay OWNER-only)
-- ---------------------------------------------------------------------------
drop policy "members_select" on class_members;
create policy "members_select" on class_members for select to authenticated
  using (
    student_id in (select public.my_profile_ids())
    or class_id in (select public.my_teaching_class_ids())
  );

drop policy "members_insert_self" on class_members;
create policy "members_insert_self" on class_members for insert to authenticated
  with check (
    student_id in (select public.my_profile_ids())
    -- a profile may not study in a class it teaches (owner or co-teacher)
    and not exists (select 1 from classes c where c.id = class_id and c.teacher_id = student_id)
    and not exists (select 1 from class_teachers ct where ct.class_id = class_members.class_id and ct.teacher_id = student_id)
  );

drop policy "members_delete" on class_members;
create policy "members_delete" on class_members for delete to authenticated
  using (
    student_id in (select public.my_profile_ids())
    or class_id in (select public.my_teaching_class_ids())
  );

drop policy "rec_select" on recordings;
create policy "rec_select" on recordings for select to authenticated
  using (
    student_id in (select public.my_profile_ids())
    or class_id in (select public.my_teaching_class_ids())
  );

drop policy "rec_update_teacher" on recordings;
create policy "rec_update_teacher" on recordings for update to authenticated
  using (class_id in (select public.my_teaching_class_ids()))
  with check (class_id in (select public.my_teaching_class_ids()));

drop policy "ann_insert_teacher" on annotations;
create policy "ann_insert_teacher" on annotations for insert to authenticated
  with check (
    teacher_id in (select public.my_profile_ids())
    and recording_id in (
      select id from recordings where class_id in (select public.my_teaching_class_ids())
    )
  );

drop policy "wirds_select" on wirds;
create policy "wirds_select" on wirds for select to authenticated
  using (
    class_id in (select public.my_teaching_class_ids())
    or (
      (student_id is null or student_id in (select public.my_profile_ids()))
      and class_id in (select class_id from class_members where student_id in (select public.my_profile_ids()))
    )
  );

drop policy "wirds_insert" on wirds;
create policy "wirds_insert" on wirds for insert to authenticated
  with check (
    teacher_id in (select public.my_profile_ids())
    and class_id in (select public.my_teaching_class_ids())
  );

drop policy "wirds_update" on wirds;
create policy "wirds_update" on wirds for update to authenticated
  using (class_id in (select public.my_teaching_class_ids()))
  with check (class_id in (select public.my_teaching_class_ids()));

drop policy "wirds_delete" on wirds;
create policy "wirds_delete" on wirds for delete to authenticated
  using (class_id in (select public.my_teaching_class_ids()));

drop policy "wird_completions_select" on wird_completions;
create policy "wird_completions_select" on wird_completions for select to authenticated
  using (
    student_id in (select public.my_profile_ids())
    or wird_id in (
      select w.id from wirds w where w.class_id in (select public.my_teaching_class_ids())
    )
  );

drop policy "wird_completions_insert" on wird_completions;
create policy "wird_completions_insert" on wird_completions for insert to authenticated
  with check (
    completed_by in (select public.my_profile_ids())
    and wird_id in (
      select w.id from wirds w where w.class_id in (select public.my_teaching_class_ids())
    )
  );

drop policy "wird_completions_delete" on wird_completions;
create policy "wird_completions_delete" on wird_completions for delete to authenticated
  using (
    wird_id in (
      select w.id from wirds w where w.class_id in (select public.my_teaching_class_ids())
    )
  );
