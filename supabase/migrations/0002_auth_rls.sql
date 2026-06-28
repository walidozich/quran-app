-- Phase 9: replace the DEV-PERMISSIVE policies with auth.uid()-scoped RLS.
-- Profiles are keyed by auth.users.id (profiles.id = auth.uid()).

-- ---------------------------------------------------------------------------
-- Drop dev policies
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','classes','class_members','recordings','annotations','tags','annotation_tags'
  ]
  loop
    execute format('drop policy if exists "_dev_all_%1$s" on %1$s', t);
  end loop;
end $$;

drop policy if exists "_dev_storage_all" on storage.objects;

-- Authenticated sessions carry the user JWT; anon needs no table access.
revoke select, insert, update, delete on all tables in schema public from anon;

-- ---------------------------------------------------------------------------
-- profiles  (names are low-sensitivity; readable by any signed-in user)
-- ---------------------------------------------------------------------------
create policy "profiles_select" on profiles for select to authenticated using (true);
create policy "profiles_insert_self" on profiles for insert to authenticated
  with check (id = auth.uid());
create policy "profiles_update_self" on profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- classes  (selectable by all authed users so students can look up a join code)
-- ---------------------------------------------------------------------------
create policy "classes_select" on classes for select to authenticated using (true);
create policy "classes_insert_own" on classes for insert to authenticated
  with check (teacher_id = auth.uid());
create policy "classes_update_own" on classes for update to authenticated
  using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
create policy "classes_delete_own" on classes for delete to authenticated
  using (teacher_id = auth.uid());

-- ---------------------------------------------------------------------------
-- class_members
-- ---------------------------------------------------------------------------
create policy "members_select" on class_members for select to authenticated
  using (student_id = auth.uid() or class_id in (select id from classes where teacher_id = auth.uid()));
create policy "members_insert_self" on class_members for insert to authenticated
  with check (student_id = auth.uid());
create policy "members_delete" on class_members for delete to authenticated
  using (student_id = auth.uid() or class_id in (select id from classes where teacher_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- recordings
-- ---------------------------------------------------------------------------
create policy "rec_select" on recordings for select to authenticated
  using (student_id = auth.uid() or class_id in (select id from classes where teacher_id = auth.uid()));
create policy "rec_insert_self" on recordings for insert to authenticated
  with check (student_id = auth.uid());
create policy "rec_update_teacher" on recordings for update to authenticated
  using (class_id in (select id from classes where teacher_id = auth.uid()))
  with check (class_id in (select id from classes where teacher_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- annotations  (teacher: own; student: only on their own REVIEWED recordings)
-- ---------------------------------------------------------------------------
create policy "ann_select" on annotations for select to authenticated
  using (
    teacher_id = auth.uid()
    or recording_id in (
      select id from recordings where student_id = auth.uid() and status = 'reviewed'
    )
  );
create policy "ann_insert_teacher" on annotations for insert to authenticated
  with check (
    teacher_id = auth.uid()
    and recording_id in (
      select id from recordings where class_id in (select id from classes where teacher_id = auth.uid())
    )
  );
create policy "ann_update_teacher" on annotations for update to authenticated
  using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
create policy "ann_delete_teacher" on annotations for delete to authenticated
  using (teacher_id = auth.uid());

-- ---------------------------------------------------------------------------
-- tags  (shared pool; anyone authed can read and add custom tags)
-- ---------------------------------------------------------------------------
create policy "tags_select" on tags for select to authenticated using (true);
create policy "tags_insert" on tags for insert to authenticated
  with check (created_by = auth.uid());

-- ---------------------------------------------------------------------------
-- annotation_tags
-- ---------------------------------------------------------------------------
create policy "anntags_select" on annotation_tags for select to authenticated using (true);
create policy "anntags_insert" on annotation_tags for insert to authenticated
  with check (annotation_id in (select id from annotations where teacher_id = auth.uid()));
create policy "anntags_delete" on annotation_tags for delete to authenticated
  using (annotation_id in (select id from annotations where teacher_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- storage: authenticated-only access to both private buckets
-- ---------------------------------------------------------------------------
create policy "storage_select_auth" on storage.objects for select to authenticated
  using (bucket_id in ('recordings', 'corrections'));
create policy "storage_insert_auth" on storage.objects for insert to authenticated
  with check (bucket_id in ('recordings', 'corrections'));
