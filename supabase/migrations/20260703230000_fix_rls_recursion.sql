-- Fix: infinite recursion (42P17) between class_members and class_teachers.
-- members_insert_self queried class_teachers, whose select policy queried
-- class_members back — Postgres aborts the cycle and every class join 500s.
-- Break both directions with SECURITY DEFINER helpers (they bypass RLS, so
-- policy evaluation never re-enters the other table's policies).

-- Does this PERSON (profile) teach this class (owner or co-teacher)?
create or replace function public.profile_teaches_class(p_profile uuid, p_class uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from classes where id = p_class and teacher_id = p_profile)
      or exists (select 1 from class_teachers where class_id = p_class and teacher_id = p_profile)
$$;
revoke all on function public.profile_teaches_class(uuid, uuid) from public, anon, authenticated;
grant execute on function public.profile_teaches_class(uuid, uuid) to authenticated;

-- Classes where any of the caller's profiles study.
create or replace function public.my_member_class_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select class_id from class_members where student_id in (select public.my_profile_ids())
$$;
revoke all on function public.my_member_class_ids() from public, anon, authenticated;
grant execute on function public.my_member_class_ids() to authenticated;

-- class_members insert: no direct reference to class_teachers anymore.
drop policy "members_insert_self" on class_members;
create policy "members_insert_self" on class_members for insert to authenticated
  with check (
    student_id in (select public.my_profile_ids())
    -- a profile may not study in a class it teaches (owner or co-teacher)
    and not public.profile_teaches_class(student_id, class_id)
  );

-- class_teachers select: no direct reference to class_members anymore.
drop policy "class_teachers_select" on class_teachers;
create policy "class_teachers_select" on class_teachers for select to authenticated
  using (
    class_id in (select public.my_teaching_class_ids())
    or class_id in (select public.my_member_class_ids())
  );
