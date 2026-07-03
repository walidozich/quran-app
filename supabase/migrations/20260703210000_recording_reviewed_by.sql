-- With multiple teachers per class, record WHO submitted the review.
alter table recordings
  add column if not exists reviewed_by uuid references profiles(id) on delete set null;
create index if not exists idx_recordings_reviewed_by on recordings(reviewed_by);
