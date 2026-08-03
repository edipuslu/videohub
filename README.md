# VideoHub — Uslu Digital client portal

Private operations portal for managing AI video production clients, their
branches, and finished video deliveries. Admins manage companies and log
deliveries; each client logs in to see only their own company's videos,
organized by branch and month.

Built with Next.js (App Router) + Supabase. Hosted target:
**https://videohub.usludigital.com**

## 1. What's already wired in

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are filled
  in at `.env.local` from your existing Supabase project
  (`gwfolukingaygsxjnzyi`).
- The database schema (`supabase/schema.sql`) matches the
  `visionhub_companies`, `visionhub_company_users`, and
  `visionhub_video_deliveries` tables you specified.
- All authentication is custom (no Supabase Auth): a single master admin
  account lives in environment variables, and each client company logs in
  with `visionhub_companies.login` + a bcrypt password hash.
- `visionhub_company_users` is created by the schema for future use (e.g.
  multiple named users per company) but the app doesn't read/write it yet
  — today, one login ID and password per company is enough to satisfy the
  "client login ID / client password" requirement.

## 2. What you still need to provide

Fill these three blanks in `.env.local`:

1. **`SUPABASE_SERVICE_ROLE_KEY`** — Supabase Dashboard → Project Settings
   → API → reveal the `service_role` secret key. This must never be
   exposed to the browser or committed to git; it only belongs in server
   environment variables (`.env.local` locally, and your host's
   environment variable settings in production).
2. **`SESSION_SECRET`** — any long random string, e.g. run
   `openssl rand -base64 48`.
3. **`ADMIN_VIDEOHUB_ID`** and **`ADMIN_PASSWORD_HASH`** — your own
   master login for Uslu Digital. Pick any ID (e.g. `uslu-admin`), then
   generate the hash:
   ```bash
   npm install
   npm run hash-password -- "your-chosen-password"
   ```
   Paste the printed hash into `ADMIN_PASSWORD_HASH`.

## 3. Create the database tables

In the Supabase SQL editor for `gwfolukingaygsxjnzyi`, run the contents of
[`supabase/schema.sql`](supabase/schema.sql). It's safe to re-run (uses
`if not exists`). This creates the three tables, indexes, and locks them
down with row level security so only the service role (used server-side)
can read or write.

## 4. Run it locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` — it redirects to `/login`. Sign in with
your `ADMIN_VIDEOHUB_ID` / password to reach the Companies Dashboard, or
create a client company first and sign in with its login ID to see the
Client Delivery Portal.

## 5. Deploy to videohub.usludigital.com

Recommended host: **Vercel** (built for Next.js, easiest custom-domain setup).

1. Push this project to a GitHub repo.
2. In Vercel: **New Project** → import the repo.
3. Under **Environment Variables**, add all six variables from
   `.env.local` (URL, anon key, service role key, session secret, admin ID,
   admin password hash) — set them for Production (and Preview if you
   want staging logins).
4. Deploy.
5. In the Vercel project → **Settings → Domains**, add
   `videohub.usludigital.com`.
6. In your DNS provider for `usludigital.com`, add the CNAME (or A/ALIAS)
   record Vercel shows you for the `videohub` subdomain.
7. Once DNS propagates, `https://videohub.usludigital.com` serves this
   app directly — no third-party login screen in front of it. The app's
   own `/login` page is the only gate.

## How it works

- **Login** (`/login`) — single form for both admin and client logins.
  The server checks the submitted VideoHub ID against the admin env vars
  first, then against `visionhub_companies.login`. A signed, httpOnly
  session cookie (`videohub_session`, via `jose`/JWT) records the role
  and, for clients, which company they belong to. `src/middleware.ts`
  blocks `/admin/*` and `/portal/*` from the wrong role.
- **Companies Dashboard** (`/admin`) — admin-only. Create companies
  (name, login ID, password, initial branches), see totals, open a
  company's dashboard, delete a company (with confirmation — cascades to
  its branches and video rows via `on delete cascade`).
- **Company Admin Dashboard** (`/admin/companies/[slug]`) — log video
  deliveries (branch, date, Drive link, duration in seconds). Post type
  is classified automatically: ≤15s → "1 post", >15s → "mega post".
  Shows monthly/branch totals and lets you delete individual video links.
  Month tabs run from **July 2026** onward.
- **Client Delivery Portal** (`/portal`) — read-only for the logged-in
  company. Branch tabs + month tabs filter deliveries; each card has an
  "Open video" link to the stored Drive/video URL. Empty months show a
  professional empty state rather than a blank page.
- **Passwords** — bcrypt-hashed (`src/lib/password.ts`, 12 salt rounds).
  If a company row ever has a legacy plaintext value in `password`
  (matching your schema's optional column) instead of `password_hash`, a
  successful login using that plaintext value automatically migrates it
  to a proper hash and clears the plaintext column.

## Project layout

```
src/
  app/
    login/page.tsx              VideoHub login screen
    admin/page.tsx               Companies Dashboard
    admin/companies/[slug]/      Company Admin Dashboard
    portal/                      Client Delivery Portal
    api/                         Auth, companies, branches, videos routes
  lib/
    supabase.ts                  Server-only Supabase client (service role)
    auth.ts                      Session cookie signing/verification
    password.ts                  bcrypt hashing + legacy-plaintext migration
    postType.ts                  Post-type classification + month utilities
    slug.ts                      Company slug generation
  middleware.ts                  Route protection by role
supabase/schema.sql              Table definitions + RLS policies
scripts/hash-password.mjs        CLI to generate a bcrypt hash for env vars
```
