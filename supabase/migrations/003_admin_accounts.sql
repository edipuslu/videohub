-- VideoHub — move the Uslu Digital admin account into the database so the
-- ID, name, and password can be changed from inside the app.
--
-- ADMIN_VIDEOHUB_ID / ADMIN_PASSWORD_HASH stay in the environment as a
-- bootstrap: they only grant access while this table is EMPTY. As soon as an
-- admin row exists, the database is the single source of truth (so changing
-- the password in the app really does retire the old one).
--
-- Locked out? Delete every row in this table and the environment login works
-- again.
--
-- Safe to run more than once.

create table if not exists public.visionhub_admins (
  id bigint generated always as identity primary key,
  login text not null unique,
  password_hash text not null,
  name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.visionhub_admins enable row level security;

drop policy if exists "VideoHub service role can manage admins" on public.visionhub_admins;

create policy "VideoHub service role can manage admins"
on public.visionhub_admins
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
