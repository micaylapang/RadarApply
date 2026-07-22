-- Company add requests from signup form
-- Run in Supabase SQL Editor if the table does not exist yet

create table if not exists company_requests (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  roles text,
  contact text,
  created_at timestamptz not null default now()
);

create index if not exists company_requests_created_at_idx
  on company_requests (created_at desc);

alter table company_requests enable row level security;
