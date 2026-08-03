-- VideoHub — multiple logins per client company.
--
-- The original `visionhub_company_users` scaffold stored only an email and an
-- admin/client role, so it could not be used to sign in. This migration turns
-- it into a real credentials table: each row is a person at a client company
-- (an owner or a worker) with their own VideoHub ID and hashed password.
--
-- Safe to run more than once.

alter table public.visionhub_company_users
  add column if not exists login text,
  add column if not exists password_hash text,
  add column if not exists name text;

-- People are identified by their VideoHub ID now, so email is optional.
alter table public.visionhub_company_users
  alter column email drop not null;

-- Swap the old admin/client roles for owner/worker.
alter table public.visionhub_company_users
  drop constraint if exists visionhub_company_users_role_check;

update public.visionhub_company_users
  set role = 'worker'
  where role not in ('owner', 'worker');

alter table public.visionhub_company_users
  add constraint visionhub_company_users_role_check
  check (role in ('owner', 'worker'));

alter table public.visionhub_company_users
  alter column role set default 'worker';

-- A VideoHub ID must identify exactly one person across the whole system.
create unique index if not exists idx_visionhub_company_users_login
  on public.visionhub_company_users(login);
