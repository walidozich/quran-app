-- v2 — account → person-profiles (spec.md §12).
-- One auth account (email) holds 1..N person-profiles; identity everywhere is the
-- profile. `role` enum is dropped: teaching is a flag on the profile.
-- Precondition: data wiped (clean slate) — profiles is empty when this runs.

-- ---------------------------------------------------------------------------
-- profiles: person fields + account ownership
-- ---------------------------------------------------------------------------
alter table profiles
  add column if not exists account_id   uuid not null references auth.users(id) on delete cascade,
  add column if not exists sex          text not null check (sex in ('male', 'female')),
  add column if not exists birth_date   date not null check (birth_date > date '1900-01-01'),
  add column if not exists is_teacher   boolean not null default false,
  add column if not exists avatar_color text not null default 'green';

alter table profiles drop column if exists role;
drop type if exists user_role;

create index if not exists idx_profiles_account on profiles(account_id);

-- Cap profiles per account (Netflix-style limit).
create or replace function public.enforce_profile_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from profiles where account_id = new.account_id) >= 6 then
    raise exception 'profile_limit_reached';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profile_limit on profiles;
create trigger trg_profile_limit
  before insert on profiles
  for each row execute function public.enforce_profile_limit();

-- ---------------------------------------------------------------------------
-- Helper: the caller's profile ids (all persons under the signed-in account).
-- SECURITY DEFINER so other tables' policies keep working even if the
-- profiles select policy is tightened later.
-- ---------------------------------------------------------------------------
create or replace function public.my_profile_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from profiles where account_id = auth.uid()
$$;

-- Supabase's default privileges grant EXECUTE on new public functions to
-- anon/authenticated — strip everything, then allow only what's needed.
revoke all on function public.my_profile_ids() from public, anon, authenticated;
grant execute on function public.my_profile_ids() to authenticated;
revoke all on function public.enforce_profile_limit() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Drop every old policy (they assume profiles.id = auth.uid())
-- ---------------------------------------------------------------------------
do $$
declare p record;
begin
  for p in
    select tablename, policyname from pg_policies
    where schemaname = 'public'
      and tablename in (
        'profiles','classes','class_members','recordings','annotations',
        'tags','annotation_tags','annotation_replies','notifications',
        'wirds','wird_completions'
      )
  loop
    execute format('drop policy %I on %I', p.policyname, p.tablename);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- profiles
-- (select stays open to authenticated: rosters, threads and the join-code
--  preview need names; revisit with an RPC if this ever needs tightening)
-- ---------------------------------------------------------------------------
create policy "profiles_select" on profiles for select to authenticated
  using (true);
create policy "profiles_insert_own_account" on profiles for insert to authenticated
  with check (account_id = (select auth.uid()));
create policy "profiles_update_own_account" on profiles for update to authenticated
  using (account_id = (select auth.uid()))
  with check (account_id = (select auth.uid()));
create policy "profiles_delete_own_account" on profiles for delete to authenticated
  using (account_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- classes (select open so students can look up a join code;
--          create requires a teaching profile of the caller's account)
-- ---------------------------------------------------------------------------
create policy "classes_select" on classes for select to authenticated
  using (true);
create policy "classes_insert_own" on classes for insert to authenticated
  with check (
    teacher_id in (
      select id from profiles
      where account_id = (select auth.uid()) and is_teacher
    )
  );
create policy "classes_update_own" on classes for update to authenticated
  using (teacher_id in (select public.my_profile_ids()))
  with check (teacher_id in (select public.my_profile_ids()));
create policy "classes_delete_own" on classes for delete to authenticated
  using (teacher_id in (select public.my_profile_ids()));

-- ---------------------------------------------------------------------------
-- class_members (a profile may not join a class it teaches)
-- ---------------------------------------------------------------------------
create policy "members_select" on class_members for select to authenticated
  using (
    student_id in (select public.my_profile_ids())
    or class_id in (select id from classes where teacher_id in (select public.my_profile_ids()))
  );
create policy "members_insert_self" on class_members for insert to authenticated
  with check (
    student_id in (select public.my_profile_ids())
    and not exists (
      select 1 from classes c where c.id = class_id and c.teacher_id = student_id
    )
  );
create policy "members_delete" on class_members for delete to authenticated
  using (
    student_id in (select public.my_profile_ids())
    or class_id in (select id from classes where teacher_id in (select public.my_profile_ids()))
  );

-- ---------------------------------------------------------------------------
-- recordings
-- ---------------------------------------------------------------------------
create policy "rec_select" on recordings for select to authenticated
  using (
    student_id in (select public.my_profile_ids())
    or class_id in (select id from classes where teacher_id in (select public.my_profile_ids()))
  );
create policy "rec_insert_self" on recordings for insert to authenticated
  with check (student_id in (select public.my_profile_ids()));
create policy "rec_update_teacher" on recordings for update to authenticated
  using (class_id in (select id from classes where teacher_id in (select public.my_profile_ids())))
  with check (class_id in (select id from classes where teacher_id in (select public.my_profile_ids())));

-- ---------------------------------------------------------------------------
-- annotations (teacher: own; student: only on their own REVIEWED recordings)
-- ---------------------------------------------------------------------------
create policy "ann_select" on annotations for select to authenticated
  using (
    teacher_id in (select public.my_profile_ids())
    or recording_id in (
      select id from recordings
      where student_id in (select public.my_profile_ids()) and status = 'reviewed'
    )
  );
create policy "ann_insert_teacher" on annotations for insert to authenticated
  with check (
    teacher_id in (select public.my_profile_ids())
    and recording_id in (
      select id from recordings
      where class_id in (select id from classes where teacher_id in (select public.my_profile_ids()))
    )
  );
create policy "ann_update_teacher" on annotations for update to authenticated
  using (teacher_id in (select public.my_profile_ids()))
  with check (teacher_id in (select public.my_profile_ids()));
create policy "ann_delete_teacher" on annotations for delete to authenticated
  using (teacher_id in (select public.my_profile_ids()));

-- ---------------------------------------------------------------------------
-- tags
-- ---------------------------------------------------------------------------
create policy "tags_select" on tags for select to authenticated using (true);
create policy "tags_insert" on tags for insert to authenticated
  with check (created_by in (select public.my_profile_ids()));

-- ---------------------------------------------------------------------------
-- annotation_tags
-- ---------------------------------------------------------------------------
create policy "anntags_select" on annotation_tags for select to authenticated using (true);
create policy "anntags_insert" on annotation_tags for insert to authenticated
  with check (annotation_id in (select id from annotations where teacher_id in (select public.my_profile_ids())));
create policy "anntags_delete" on annotation_tags for delete to authenticated
  using (annotation_id in (select id from annotations where teacher_id in (select public.my_profile_ids())));

-- ---------------------------------------------------------------------------
-- annotation_replies
-- ---------------------------------------------------------------------------
create policy "replies_select" on annotation_replies for select to authenticated
  using (
    annotation_id in (
      select a.id from annotations a join recordings r on r.id = a.recording_id
      where a.teacher_id in (select public.my_profile_ids())
         or (r.student_id in (select public.my_profile_ids()) and r.status = 'reviewed')
    )
  );
create policy "replies_insert" on annotation_replies for insert to authenticated
  with check (
    author_id in (select public.my_profile_ids())
    and annotation_id in (
      select a.id from annotations a join recordings r on r.id = a.recording_id
      where a.teacher_id in (select public.my_profile_ids())
         or (r.student_id in (select public.my_profile_ids()) and r.status = 'reviewed')
    )
  );

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
create policy "notif_select_own" on notifications for select to authenticated
  using (recipient_id in (select public.my_profile_ids()));
create policy "notif_insert_actor" on notifications for insert to authenticated
  with check (actor_id in (select public.my_profile_ids()));
create policy "notif_update_own" on notifications for update to authenticated
  using (recipient_id in (select public.my_profile_ids()))
  with check (recipient_id in (select public.my_profile_ids()));

-- ---------------------------------------------------------------------------
-- wirds
-- ---------------------------------------------------------------------------
create policy "wirds_select" on wirds for select to authenticated
  using (
    class_id in (select id from classes where teacher_id in (select public.my_profile_ids()))
    or (
      (student_id is null or student_id in (select public.my_profile_ids()))
      and class_id in (select class_id from class_members where student_id in (select public.my_profile_ids()))
    )
  );
create policy "wirds_insert" on wirds for insert to authenticated
  with check (
    teacher_id in (select public.my_profile_ids())
    and class_id in (select id from classes where teacher_id in (select public.my_profile_ids()))
  );
create policy "wirds_update" on wirds for update to authenticated
  using (class_id in (select id from classes where teacher_id in (select public.my_profile_ids())))
  with check (class_id in (select id from classes where teacher_id in (select public.my_profile_ids())));
create policy "wirds_delete" on wirds for delete to authenticated
  using (class_id in (select id from classes where teacher_id in (select public.my_profile_ids())));

-- ---------------------------------------------------------------------------
-- wird_completions
-- ---------------------------------------------------------------------------
create policy "wird_completions_select" on wird_completions for select to authenticated
  using (
    student_id in (select public.my_profile_ids())
    or wird_id in (
      select w.id from wirds w join classes c on c.id = w.class_id
      where c.teacher_id in (select public.my_profile_ids())
    )
  );
create policy "wird_completions_insert" on wird_completions for insert to authenticated
  with check (
    completed_by in (select public.my_profile_ids())
    and wird_id in (
      select w.id from wirds w join classes c on c.id = w.class_id
      where c.teacher_id in (select public.my_profile_ids())
    )
  );
create policy "wird_completions_delete" on wird_completions for delete to authenticated
  using (
    wird_id in (
      select w.id from wirds w join classes c on c.id = w.class_id
      where c.teacher_id in (select public.my_profile_ids())
    )
  );

-- Storage policies are unchanged: authenticated select/insert on the two
-- private buckets (paths are profile-scoped by convention, not by policy).
