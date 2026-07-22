-- Season pass fields on users (run in Supabase SQL Editor if columns are missing)

alter table users
  add column if not exists season_pass_expires_at timestamptz,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_checkout_session_id text;

create index if not exists users_season_pass_expires_at_idx
  on users (season_pass_expires_at)
  where season_pass_expires_at is not null;
