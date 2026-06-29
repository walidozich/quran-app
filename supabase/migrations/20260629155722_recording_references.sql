-- Structured Quran references for recordings.
-- Labels remain editable/display-only; these nullable columns power analytics.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'recording_ref_type') then
    create type recording_ref_type as enum ('ayah', 'page');
  end if;
end $$;

alter table recordings
  add column if not exists ref_type recording_ref_type,
  add column if not exists surah_start smallint,
  add column if not exists ayah_start smallint,
  add column if not exists surah_end smallint,
  add column if not exists ayah_end smallint,
  add column if not exists page_start smallint,
  add column if not exists page_end smallint;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'recordings_ref_shape'
  ) then
    alter table recordings add constraint recordings_ref_shape check (
      (
        ref_type is null
        and surah_start is null
        and ayah_start is null
        and surah_end is null
        and ayah_end is null
        and page_start is null
        and page_end is null
      )
      or (
        ref_type = 'ayah'
        and surah_start between 1 and 114
        and surah_end between 1 and 114
        and ayah_start >= 1
        and ayah_end >= 1
        and (
          surah_end > surah_start
          or (surah_end = surah_start and ayah_end >= ayah_start)
        )
        and page_start is null
        and page_end is null
      )
      or (
        ref_type = 'page'
        and page_start between 1 and 604
        and page_end between 1 and 604
        and page_end >= page_start
        and surah_start is null
        and ayah_start is null
        and surah_end is null
        and ayah_end is null
      )
    );
  end if;
end $$;

create index if not exists idx_recordings_ref_ayah
  on recordings(surah_start, surah_end)
  where ref_type = 'ayah';

create index if not exists idx_recordings_ref_page
  on recordings(page_start, page_end)
  where ref_type = 'page';
