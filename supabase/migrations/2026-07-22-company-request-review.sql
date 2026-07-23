-- Review queue for company add requests + preserve request-added internships on seed

alter table company_requests
  add column if not exists status text not null default 'pending',
  add column if not exists reviewed_at timestamptz,
  add column if not exists review_note text;

alter table company_requests
  drop constraint if exists company_requests_status_check;

alter table company_requests
  add constraint company_requests_status_check
  check (status in ('pending', 'approved', 'rejected'));

create index if not exists company_requests_status_created_idx
  on company_requests (status, created_at desc);

alter table internships
  add column if not exists managed_by text not null default 'catalog';

alter table internships
  drop constraint if exists internships_managed_by_check;

alter table internships
  add constraint internships_managed_by_check
  check (managed_by in ('catalog', 'request'));
