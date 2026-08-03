-- VideoHub — let admins read back the current client passwords.
--
-- Stores an ENCRYPTED (AES-256-GCM) copy of each client login password so the
-- Uslu Digital admin can look it up and tell a client what their password is.
--
-- The bcrypt `password_hash` above is unchanged and is still what actually
-- verifies a login. This column is display-only, and is useless without
-- SESSION_SECRET / PASSWORD_VAULT_KEY from the server environment.
--
-- Safe to run more than once.

alter table public.visionhub_company_users
  add column if not exists password_vault text;

alter table public.visionhub_companies
  add column if not exists password_vault text;
