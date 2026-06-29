-- In-app notification center: a durable record of each push event so users have
-- history (push delivery itself is ephemeral).

create table if not exists notifications (
  id            uuid primary key default gen_random_uuid(),
  recipient_id  uuid not null references profiles(id) on delete cascade,
  actor_id      uuid references profiles(id) on delete set null,
  type          text,
  title         text not null,
  body          text,
  recording_id  uuid references recordings(id) on delete cascade,
  read          boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists idx_notifications_recipient
  on notifications(recipient_id, created_at desc);

alter table notifications enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='notifications' and policyname='notif_select_own') then
    create policy "notif_select_own" on notifications for select to authenticated
      using (recipient_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='notifications' and policyname='notif_insert_actor') then
    create policy "notif_insert_actor" on notifications for insert to authenticated
      with check (actor_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='notifications' and policyname='notif_update_own') then
    create policy "notif_update_own" on notifications for update to authenticated
      using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());
  end if;
end $$;

grant select, insert, update on notifications to authenticated;
