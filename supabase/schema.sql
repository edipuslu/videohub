-- VisionHub (Uslu Digital) schema
-- Run this once in the Supabase SQL editor for your project.

create table if not exists public.visionhub_companies (
  slug text primary key,
  name text not null,
  description text not null default '',
  login text not null unique,
  password text,
  password_hash text,
  projects integer not null default 0,
  color text,
  color_name text,
  branches jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.visionhub_company_users (
  id bigint generated always as identity primary key,
  company_slug text not null references public.visionhub_companies(slug) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'client')),
  created_at timestamptz not null default now(),
  unique (company_slug, email)
);

create table if not exists public.visionhub_video_deliveries (
  id bigint generated always as identity primary key,
  company_slug text not null references public.visionhub_companies(slug) on delete cascade,
  branch_name text not null,
  video_date date not null,
  drive_link text not null,
  duration_seconds integer not null,
  post_type text not null check (post_type in ('1 post', 'mega post')),
  created_at timestamptz not null default now()
);

create index if not exists idx_visionhub_company_users_company_slug
on public.visionhub_company_users(company_slug);

create index if not exists idx_visionhub_video_deliveries_company_date
on public.visionhub_video_deliveries(company_slug, video_date desc);

-- Row Level Security: the app talks to Supabase only from the server
-- using SUPABASE_SERVICE_ROLE_KEY (never exposed to the browser), so
-- these tables stay locked down to that role.
alter table public.visionhub_companies enable row level security;
alter table public.visionhub_company_users enable row level security;
alter table public.visionhub_video_deliveries enable row level security;

create policy "VisionHub service role can manage companies"
on public.visionhub_companies
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create policy "VisionHub service role can manage company users"
on public.visionhub_company_users
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create policy "VisionHub service role can manage video deliveries"
on public.visionhub_video_deliveries
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
