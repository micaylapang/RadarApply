-- DropText schema for Supabase
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run

create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists internships (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  title text not null,
  slug text not null unique,
  description text,
  apply_url text,
  source_type text not null default 'manual',
  source_key text,
  title_filter text,
  status text not null default 'closed',
  opened_at timestamptz,
  last_checked timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  internship_id uuid not null references internships (id) on delete cascade,
  created_at timestamptz not null default now(),
  alerted_at timestamptz,
  unique (user_id, internship_id)
);

create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  internship_id uuid not null references internships (id) on delete cascade,
  phone text not null,
  body text not null,
  status text not null default 'sent',
  latency_ms integer,
  created_at timestamptz not null default now()
);

create index if not exists subscriptions_internship_id_idx on subscriptions (internship_id);
create index if not exists subscriptions_user_id_idx on subscriptions (user_id);
create index if not exists alerts_internship_id_idx on alerts (internship_id);

-- Server uses the service role key (bypasses RLS).
-- Keep RLS on so the anon key cannot read/write directly from the browser.
alter table users enable row level security;
alter table internships enable row level security;
alter table subscriptions enable row level security;
alter table alerts enable row level security;

-- Public read of internship catalog (optional; signup still goes through Next.js API)
create policy "Public can read internships"
  on internships for select
  to anon, authenticated
  using (true);
