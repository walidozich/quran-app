-- Per-user Expo push token (for review/recording notifications).
alter table profiles add column if not exists expo_push_token text;
