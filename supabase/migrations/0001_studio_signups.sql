-- inkOrange Studios: signup and contact tables.
--
-- This Supabase project is SHARED with other apps (TerraForge, affiliate and
-- pitch tables, ...). Their tables exist here and are theirs to manage; this
-- file creates and touches only studio_* tables.
--
-- Applied BY HAND (SQL editor or MCP apply_migration), never `supabase db push`.
-- Re-running is safe: every statement is idempotent.
--
-- Grants are explicit in this file because from 2026-10-30 Supabase no longer
-- grants the API roles access to new tables in "public" automatically. Each
-- table: RLS on with NO policies, anon/authenticated revoked, service_role
-- granted. Only server actions (service-role key) ever read or write these.
--
-- Uniqueness on email is case-sensitive in Postgres; it behaves as
-- case-insensitive only because the app lower-cases and trims every address
-- (normalizeEmail) before insert.

create table if not exists public.studio_newsletter_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'footer',
  created_at timestamptz not null default now()
);
create unique index if not exists studio_newsletter_signups_email_idx on public.studio_newsletter_signups (email);
alter table public.studio_newsletter_signups enable row level security;
revoke all on table public.studio_newsletter_signups from anon, authenticated;
grant all on table public.studio_newsletter_signups to service_role;

create table if not exists public.studio_beta_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  game text not null,
  platform text,
  source text not null default 'callout',
  created_at timestamptz not null default now()
);
create unique index if not exists studio_beta_signups_email_game_idx on public.studio_beta_signups (email, game);
alter table public.studio_beta_signups enable row level security;
revoke all on table public.studio_beta_signups from anon, authenticated;
grant all on table public.studio_beta_signups to service_role;

create table if not exists public.studio_launch_alerts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  game text not null,
  platform text not null,
  created_at timestamptz not null default now()
);
create unique index if not exists studio_launch_alerts_uniq_idx on public.studio_launch_alerts (email, game, platform);
alter table public.studio_launch_alerts enable row level security;
revoke all on table public.studio_launch_alerts from anon, authenticated;
grant all on table public.studio_launch_alerts to service_role;

create table if not exists public.studio_contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  topic text not null default 'general',
  message text not null,
  created_at timestamptz not null default now()
);
alter table public.studio_contact_messages enable row level security;
revoke all on table public.studio_contact_messages from anon, authenticated;
grant all on table public.studio_contact_messages to service_role;
