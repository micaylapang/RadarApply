-- Persist logo URL for request-approved (and other) companies.
alter table internships
  add column if not exists logo_url text;
