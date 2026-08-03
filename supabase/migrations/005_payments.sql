-- VideoHub — monthly client payments.
--
-- Each company is charged its own rate per 15-second block. A month's bill is
-- the full blocks at that rate, plus the leftover seconds charged pro-rata
-- (leftover / 15 x rate). Admins record when a month has been paid.
--
-- Safe to run more than once.

-- The company's own rate per 15s block, e.g. 190, 250, 320.
alter table public.visionhub_companies
  add column if not exists price_per_block numeric;

create table if not exists public.visionhub_payments (
  id bigint generated always as identity primary key,
  company_slug text not null references public.visionhub_companies(slug) on delete cascade,
  -- Billing month, e.g. '2026-08'.
  month text not null,
  -- Rate snapshot, so changing a company's price later never rewrites history.
  price_per_block numeric not null default 0,
  blocks integer not null default 0,
  leftover_seconds integer not null default 0,
  blocks_amount numeric not null default 0,
  leftover_amount numeric not null default 0,
  total numeric not null default 0,
  status text not null default 'unpaid' check (status in ('unpaid', 'paid')),
  paid_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_slug, month)
);

create index if not exists idx_visionhub_payments_month
on public.visionhub_payments(month);

alter table public.visionhub_payments enable row level security;

drop policy if exists "VideoHub service role can manage payments" on public.visionhub_payments;

create policy "VideoHub service role can manage payments"
on public.visionhub_payments
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
