-- Full company_requests + review support (idempotent).
-- Run once in: Supabase Dashboard → SQL Editor → New query → Run

create extension if not exists "pgcrypto";

create table if not exists company_requests (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  roles text,
  contact text,
  status text not null default 'pending',
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now()
);

alter table company_requests
  add column if not exists status text not null default 'pending',
  add column if not exists reviewed_at timestamptz,
  add column if not exists review_note text;

alter table company_requests
  drop constraint if exists company_requests_status_check;

alter table company_requests
  add constraint company_requests_status_check
  check (status in ('pending', 'approved', 'rejected'));

create index if not exists company_requests_created_at_idx
  on company_requests (created_at desc);

create index if not exists company_requests_status_created_idx
  on company_requests (status, created_at desc);

alter table company_requests enable row level security;

alter table internships
  add column if not exists managed_by text not null default 'catalog';

alter table internships
  drop constraint if exists internships_managed_by_check;

alter table internships
  add constraint internships_managed_by_check
  check (managed_by in ('catalog', 'request'));
